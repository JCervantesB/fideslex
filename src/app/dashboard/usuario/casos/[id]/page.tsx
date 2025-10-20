import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles, cases, caseDocuments } from "@/db/schema";
import { eq } from "drizzle-orm";
import CaseDetailClient from "@/components/dashboard/usuario/CaseDetailClient";
import CaseMessages from "@/components/dashboard/usuario/CaseMessages";

export default async function CasoDetallePage({ params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!profile || (profile.role !== "usuario" && profile.role !== "administrador")) {
    redirect("/dashboard/cliente");
  }

  const id = Number(params.id);
  if (Number.isNaN(id)) redirect("/dashboard/usuario/casos");

  const rows = await db
    .select({
      id: cases.id,
      nombre: cases.nombre,
      asunto: cases.asunto,
      descripcion: cases.descripcion,
      appointmentId: cases.appointmentId,
      clientId: cases.clientId,
      clientFirstName: profiles.firstName,
      clientLastName: profiles.lastName,
      userId: cases.userId,
    })
    .from(cases)
    .innerJoin(profiles, eq(cases.clientId, profiles.userId))
    .where(eq(cases.id, id));
  const item = rows[0];
  if (!item) redirect("/dashboard/usuario/casos");
  if (profile.role !== "administrador" && item.userId !== session.user.id) {
    redirect("/dashboard/usuario/casos");
  }

  const docRows = await db.select().from(caseDocuments).where(eq(caseDocuments.caseId, id));
  const docs = docRows.map((d) => ({ id: d.id as number, fileName: d.fileName as string, fileUrl: d.fileUrl as string }));

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{item.nombre}</h1>
        <p className="text-muted-foreground">Asunto: {item.asunto}</p>
      </div>

      <div className="rounded-md border p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-muted-foreground">Cliente</span>
            <div>{item.clientFirstName} {item.clientLastName}</div>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">ID de cita (referencia)</span>
            <div>{item.appointmentId ?? "—"}</div>
          </div>
        </div>
        {item.descripcion && (
          <div className="mt-4">
            <span className="text-sm text-muted-foreground">Descripción</span>
            <p className="mt-1 whitespace-pre-wrap">{item.descripcion}</p>
          </div>
        )}
      </div>

      <CaseMessages caseId={id} />

      <CaseDetailClient caseId={id} initialDocs={docs} />
    </div>
  );
}