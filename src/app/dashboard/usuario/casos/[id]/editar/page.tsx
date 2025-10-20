import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles, cases, appointments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import EditCaseForm from "@/components/dashboard/usuario/EditCaseForm";

export default async function EditarCasoPage({ params }: { params: { id: string } }) {
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

  const rows = await db.select().from(cases).where(eq(cases.id, id));
  const item = rows[0];
  if (!item) redirect("/dashboard/usuario/casos");
  if (profile.role !== "administrador" && item.userId !== session.user.id) {
    redirect(`/dashboard/usuario/casos/${id}`);
  }

  const clientsRows = await db.select({ userId: profiles.userId, name: profiles.firstName }).from(profiles).where(eq(profiles.role, "cliente"));
  const clients = clientsRows.map((c) => ({ userId: c.userId as string, name: (c.name as string) || (c.userId as string) }));

  // Citas del usuario actual ordenadas desde la más reciente
  const apptRows = await db
    .select({ id: appointments.id, startAt: appointments.startAt, clientName: appointments.clientName })
    .from(appointments)
    .where(eq(appointments.userId, session.user.id))
    .orderBy(desc(appointments.startAt));
  const appointmentsOptions = apptRows.map((a) => {
    const dateStr = (a.startAt as unknown as Date).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
    const client = a.clientName ? ` — ${a.clientName}` : "";
    return { id: a.id as number, label: `${dateStr}${client}` };
  });

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-semibold">Editar caso</h1>
      <EditCaseForm
        caseId={id}
        initial={{
          nombre: item.nombre as string,
          asunto: item.asunto as string,
          descripcion: (item.descripcion as string | null) ?? null,
          clientId: item.clientId as string,
          appointmentId: (item.appointmentId as number | null) ?? null,
          clients,
        }}
        appointments={appointmentsOptions}
      />
    </div>
  );
}