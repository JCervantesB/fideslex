import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles, cases } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function UsuarioCasosPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!profile || (profile.role !== "usuario" && profile.role !== "administrador")) {
    redirect("/dashboard/cliente");
  }

  const rows = await db
    .select({
      id: cases.id,
      nombre: cases.nombre,
      asunto: cases.asunto,
      clientId: cases.clientId,
      clientFirstName: profiles.firstName,
      clientLastName: profiles.lastName,
    })
    .from(cases)
    .innerJoin(profiles, eq(cases.clientId, profiles.userId))
    .where(eq(cases.userId, session.user.id));

  const items = rows.map((r) => ({
    id: r.id as number,
    nombre: r.nombre as string,
    asunto: r.asunto as string,
    clientId: r.clientId as string,
    clientName: `${r.clientFirstName} ${r.clientLastName}`,
  }));

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Casos</h1>
          <p className="text-muted-foreground">Gestión de casos asociados a clientes.</p>
        </div>
        <Link href="/dashboard/usuario/casos/nuevo" className="inline-flex items-center rounded-md border px-3 py-2 hover:bg-muted">
          Nuevo caso
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-md border p-4 text-sm text-muted-foreground">No hay casos para mostrar.</div>
      ) : (
        <>
          {/* Vista móvil: tarjetas */}
          <div className="md:!hidden space-y-3">
            {items.map((c) => (
              <div key={c.id} className="rounded-md border p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{c.nombre}</p>
                    <p className="text-sm text-muted-foreground">{c.asunto}</p>
                    <p className="text-sm text-muted-foreground">Cliente: {c.clientName}</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Link href={`/dashboard/usuario/casos/${c.id}`} className="text-sm underline underline-offset-2">Ver</Link>
                  <Link href={`/dashboard/usuario/casos/${c.id}/editar`} className="text-sm underline underline-offset-2">Editar</Link>
                </div>
              </div>
            ))}
          </div>

          {/* Vista escritorio: tabla */}
          <div className="hidden md:!block overflow-x-auto">
            <table className="min-w-full border rounded-md">
              <thead>
                <tr className="border-b bg-muted">
                  <th className="text-left p-3">Nombre</th>
                  <th className="text-left p-3">Asunto</th>
                  <th className="text-left p-3">Cliente</th>
                  <th className="text-left p-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id} className="border-b">
                    <td className="p-3">{c.nombre}</td>
                    <td className="p-3">{c.asunto}</td>
                    <td className="p-3">{c.clientName}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Link href={`/dashboard/usuario/casos/${c.id}`} className="text-sm underline underline-offset-2">Ver</Link>
                        <Link href={`/dashboard/usuario/casos/${c.id}/editar`} className="text-sm underline underline-offset-2">Editar</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}