import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles, services } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function UsuarioServiciosPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!profile || (profile.role !== "usuario" && profile.role !== "administrador")) {
    redirect("/dashboard/cliente");
  }

  // Mostrar todos los servicios disponibles para usuarios y administradores
  const rows = await db
    .select({
      id: services.id,
      nombre: services.nombre,
      descripcion: services.descripcion,
      precio: services.precio,
      estado: services.estado,
    })
    .from(services);
  const items: Array<{ id: number; nombre: string; descripcion: string | null; precio: string; estado: string }> = rows;

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-2">Servicios</h1>
      <p className="text-muted-foreground mb-6">
        Listado de servicios disponibles.
      </p>

      {items.length === 0 ? (
        <div className="rounded-md border p-4 text-sm text-muted-foreground">No hay servicios para mostrar.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border rounded-md">
            <thead>
              <tr className="border-b bg-muted">
                <th className="text-left p-3">Nombre</th>
                <th className="text-left p-3">Descripción</th>
                <th className="text-left p-3">Precio</th>
                <th className="text-left p-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id} className="border-b hover:bg-muted">
                  <td className="p-3 font-medium">{s.nombre}</td>
                  <td className="p-3">{s.descripcion ?? ""}</td>
                  <td className="p-3">{s.precio}</td>
                  <td className="p-3">{s.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}