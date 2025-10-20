import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles, cases, caseDocuments } from "@/db/schema";
import { eq } from "drizzle-orm";
import CaseDetailClient from "@/components/dashboard/usuario/CaseDetailClient";
import CaseMessages from "@/components/dashboard/usuario/CaseMessages";

export default async function CasoDetalleClientePage({ params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!profile || profile.role !== "cliente") {
    redirect("/dashboard/usuario");
  }

  const id = Number(params.id);
  if (Number.isNaN(id)) redirect("/dashboard/cliente");

  let item: { id: number; nombre: string; asunto: string; descripcion: string | null; appointmentId: number | null; clientId: string; userId: string } | null = null;
  try {
    const rows = await db
      .select({
        id: cases.id,
        nombre: cases.nombre,
        asunto: cases.asunto,
        descripcion: cases.descripcion,
        appointmentId: cases.appointmentId,
        clientId: cases.clientId,
        userId: cases.userId,
      })
      .from(cases)
      .where(eq(cases.id, id));
    item = rows[0] ?? null;
  } catch {
    item = null;
  }

  if (!item) redirect("/dashboard/cliente");
  if (item.clientId !== session.user.id) {
    redirect("/dashboard/cliente");
  }

  let docs: Array<{ id: number; fileName: string; fileUrl: string }> = [];
  try {
    const docRows = await db.select().from(caseDocuments).where(eq(caseDocuments.caseId, id));
    docs = docRows.map((d) => ({ id: d.id as number, fileName: d.fileName as string, fileUrl: d.fileUrl as string }));
  } catch {
    docs = [];
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{item.nombre}</h1>
        <p className="text-muted-foreground">Asunto: {item.asunto}</p>
      </div>

      {item.descripcion && (
        <div className="rounded-md border p-4">
          <span className="text-sm text-muted-foreground">Descripción</span>
          <p className="mt-1 whitespace-pre-wrap">{item.descripcion}</p>
        </div>
      )}

      <CaseMessages caseId={id} />

      <CaseDetailClient caseId={id} initialDocs={docs} />
    </div>
  );
}