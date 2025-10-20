import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { profiles, appointments, appointmentServices, services } from "@/db/schema";
import { eq, asc, inArray } from "drizzle-orm";
import AppointmentsTable from "@/components/dashboard/usuario/AppointmentsTable";

export default async function DashboardUsuarioPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const userId = session.user.id;
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));

  if (!profile || (profile.role !== "usuario" && profile.role !== "administrador")) {
    redirect("/dashboard/cliente");
  }

  // Citas del usuario (profesional): se muestran datos del cliente desde la cita
  const ownApptsRows = await db
    .select({
      id: appointments.id,
      startAt: appointments.startAt,
      endAt: appointments.endAt,
      status: appointments.status,
      clientName: appointments.clientName,
      clientEmail: appointments.clientEmail,
    })
    .from(appointments)
    .where(eq(appointments.userId, userId))
    .orderBy(asc(appointments.startAt));

  const ownApptIds = ownApptsRows.map((a) => a.id as number);
  let ownServicesMap = new Map<number, string[]>();
  if (ownApptIds.length > 0) {
    const ownSrvRows = await db
      .select({ appointmentId: appointmentServices.appointmentId, nombre: services.nombre })
      .from(appointmentServices)
      .innerJoin(services, eq(appointmentServices.serviceId, services.id))
      .where(inArray(appointmentServices.appointmentId, ownApptIds));
    ownServicesMap = ownSrvRows.reduce((map, row) => {
      const list = map.get(row.appointmentId) ?? [];
      list.push(row.nombre as string);
      map.set(row.appointmentId, list);
      return map;
    }, new Map<number, string[]>());
  }

  const ownItems = ownApptsRows.map((a) => ({
    id: a.id as number,
    startAt: (a.startAt as unknown as Date).toISOString(),
    endAt: (a.endAt as unknown as Date).toISOString(),
    status: a.status as string,
    clientName: a.clientName as string | null,
    clientEmail: a.clientEmail as string | null,
    services: ownServicesMap.get(a.id as number) ?? [],
  }));

  // Vista admin: todas las citas de todos los usuarios (incluye nombre del profesional)
  let allItems: Array<{ id: number; startAt: string; endAt: string; status: string; providerName: string | null; clientName: string | null; clientEmail: string | null; services: string[] }> = [];

  if (profile.role === "administrador") {
    const allRows = await db
      .select({
        id: appointments.id,
        startAt: appointments.startAt,
        endAt: appointments.endAt,
        status: appointments.status,
        providerFirstName: profiles.firstName,
        providerLastName: profiles.lastName,
        clientName: appointments.clientName,
        clientEmail: appointments.clientEmail,
      })
      .from(appointments)
      .innerJoin(profiles, eq(appointments.userId, profiles.userId))
      .orderBy(asc(appointments.startAt));

    const allIds = allRows.map((a) => a.id as number);
    let allServicesMap = new Map<number, string[]>();
    if (allIds.length > 0) {
      const srvRows = await db
        .select({ appointmentId: appointmentServices.appointmentId, nombre: services.nombre })
        .from(appointmentServices)
        .innerJoin(services, eq(appointmentServices.serviceId, services.id))
        .where(inArray(appointmentServices.appointmentId, allIds));
      allServicesMap = srvRows.reduce((map, row) => {
        const list = map.get(row.appointmentId) ?? [];
        list.push(row.nombre as string);
        map.set(row.appointmentId, list);
        return map;
      }, new Map<number, string[]>());
    }

    allItems = allRows.map((a) => ({
      id: a.id as number,
      startAt: (a.startAt as unknown as Date).toISOString(),
      endAt: (a.endAt as unknown as Date).toISOString(),
      status: a.status as string,
      providerName: `${a.providerFirstName} ${a.providerLastName}`,
      clientName: a.clientName as string | null,
      clientEmail: a.clientEmail as string | null,
      services: allServicesMap.get(a.id as number) ?? [],
    }));
  }

  return (
    <div className="container mx-auto px-4 py-12 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard Usuario</h1>
        <p className="mt-2 text-muted-foreground">Bienvenido, {session.user.name ?? session.user.email}</p>
      </div>

      <AppointmentsTable title="Mis citas" items={ownItems} showProvider={false} canEdit={true} />

      {profile.role === "administrador" && (
        <AppointmentsTable title="Todas las citas (Admin)" items={allItems} showProvider={true} canEdit={true} />
      )}
    </div>
  );
}