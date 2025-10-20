import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { profiles, appointments, services, categories, serviceCategories, cases } from "@/db/schema";
import { eq, asc, inArray, and, lt } from "drizzle-orm";
import MyAppointments from "@/components/dashboard/cliente/MyAppointments";
import ScheduleAppointment from "@/components/dashboard/cliente/ScheduleAppointment";

export default async function DashboardClientePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const userId = session.user.id;
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
  const role = profile?.role ?? "cliente";

  if (role === "usuario") {
    redirect("/dashboard/usuario");
  }

  // Auto-finalizar citas pendientes vencidas (más de 30m desde inicio -> endAt < ahora)
  const now = new Date();
  await db
    .update(appointments)
    .set({ status: "finalizado", updatedAt: now })
    .where(and(eq(appointments.clientId, userId), eq(appointments.status, "pendiente"), lt(appointments.endAt, now)));

  // Citas del cliente (join para nombre del profesional)
  const appts = await db
    .select({
      id: appointments.id,
      startAt: appointments.startAt,
      endAt: appointments.endAt,
      status: appointments.status,
      providerFirstName: profiles.firstName,
      providerLastName: profiles.lastName,
    })
    .from(appointments)
    .innerJoin(profiles, eq(appointments.userId, profiles.userId))
    .where(eq(appointments.clientId, userId))
    .orderBy(asc(appointments.startAt));

  const items = appts.map((a) => ({
    id: a.id,
    startAt: (a.startAt as unknown as Date).toISOString(),
    endAt: (a.endAt as unknown as Date).toISOString(),
    status: a.status as string,
    providerName: `${a.providerFirstName} ${a.providerLastName}`,
  }));

  let clientCases: Array<{ id: number; nombre: string; asunto: string }> = [];
  try {
    const caseRows = await db
      .select({ id: cases.id, nombre: cases.nombre, asunto: cases.asunto })
      .from(cases)
      .where(eq(cases.clientId, userId));
    clientCases = caseRows.map((c) => ({ id: c.id as number, nombre: c.nombre as string, asunto: c.asunto as string }));
  } catch {
    clientCases = [];
  }

  const hasPending = items.some((it) => it.status === "pendiente");

  // Servicios activos
  const serviceRows = await db
    .select({ id: services.id, nombre: services.nombre })
    .from(services);
  const serviceOptions = serviceRows.map((s) => ({ id: s.id as number, nombre: (s.nombre as string) || "Servicio" }));

  // Categorías y asignaciones (secciones por categoría, sin "Otros")
  const categoryRows = await db
    .select({ id: categories.id, nombre: categories.nombre })
    .from(categories);

  const serviceIds = serviceOptions.map((s) => s.id);
  let groups: Array<{ nombre: string; services: Array<{ id: number; nombre: string }> }> = [];

  // Precrear todas las categorías aunque no tengan servicios asignados
  const byCategory = new Map<string, Array<{ id: number; nombre: string }>>();
  for (const cat of categoryRows) {
    const nombre = (cat.nombre as string) || "Categoría";
    if (!byCategory.has(nombre)) byCategory.set(nombre, []);
  }

  if (serviceIds.length > 0) {
    const scRows = await db
      .select({
        serviceId: serviceCategories.serviceId,
        categoryNombre: categories.nombre,
      })
      .from(serviceCategories)
      .innerJoin(categories, eq(serviceCategories.categoryId, categories.id))
      .where(inArray(serviceCategories.serviceId, serviceIds));

    for (const row of scRows) {
      const catNombre = (row.categoryNombre as string) || "Categoría";
      const svc = serviceOptions.find((s) => s.id === (row.serviceId as number));
      if (!svc) continue;
      const list = byCategory.get(catNombre) ?? [];
      // evitar duplicados del mismo servicio dentro de la categoría
      if (!list.some((x) => x.id === svc.id)) {
        list.push({ id: svc.id, nombre: svc.nombre });
      }
      byCategory.set(catNombre, list);
    }
  }

  groups = Array.from(byCategory.entries())
    .map(([nombre, services]) => ({ nombre, services }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  return (
    <div className="container mx-auto px-4 py-12 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard Cliente</h1>
        <p className="mt-2 text-muted-foreground">Bienvenido, {session.user.name ?? session.user.email}</p>
      </div>

      <MyAppointments items={items} />

      {!hasPending && <ScheduleAppointment groups={groups} />}
      {hasPending && (
        <p className="text-sm text-muted-foreground">Ya tienes una cita pendiente. Podrás crear una nueva cuando finalice.</p>
      )}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Casos</h2>
        {clientCases.length === 0 ? (
          <div className="rounded-md border p-4 text-sm text-muted-foreground">No tienes casos asociados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border rounded-md">
              <thead>
                <tr className="border-b bg-muted">
                  <th className="text-left p-3">Nombre</th>
                  <th className="text-left p-3">Asunto</th>
                  <th className="text-left p-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientCases.map((c) => (
                  <tr key={c.id} className="border-b">
                    <td className="p-3">{c.nombre}</td>
                    <td className="p-3">{c.asunto}</td>
                    <td className="p-3">
                      <a href={`/dashboard/cliente/casos/${c.id}`} className="text-sm underline underline-offset-2">Ver</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}