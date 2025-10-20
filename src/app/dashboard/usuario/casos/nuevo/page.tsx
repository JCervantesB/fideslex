import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles, appointments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import CreateCaseForm from "@/components/dashboard/usuario/CreateCaseForm";

export default async function NuevoCasoPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!profile || (profile.role !== "usuario" && profile.role !== "administrador")) {
    redirect("/dashboard/cliente");
  }

  const clientRows = await db
    .select({ userId: profiles.userId, firstName: profiles.firstName, lastName: profiles.lastName, role: profiles.role })
    .from(profiles);
  const clients = clientRows.filter((c) => c.role === "cliente").map((c) => ({ userId: c.userId as string, name: `${c.firstName} ${c.lastName}` }));

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
      <div>
        <h1 className="text-2xl font-semibold">Nuevo caso</h1>
        <p className="text-muted-foreground">Completa la información para crear un caso.</p>
      </div>
      <CreateCaseForm clients={clients} appointments={appointmentsOptions} />
    </div>
  );
}