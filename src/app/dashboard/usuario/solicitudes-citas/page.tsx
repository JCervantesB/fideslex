import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles, appointmentRequests, services } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import RequestsConverter from "./RequestsConverter";

export default async function UsuarioSolicitudesCitasPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!profile || (profile.role !== "usuario" && profile.role !== "administrador")) {
    redirect("/dashboard/cliente");
  }

  const requests = await db
    .select()
    .from(appointmentRequests)
    .orderBy(desc(appointmentRequests.createdAt));

  const svcRows = await db
    .select({ id: services.id, nombre: services.nombre, estado: services.estado })
    .from(services);
  const svcList: Array<{ id: number; nombre: string; estado: string }> = svcRows;

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-2">Solicitudes de citas</h1>
      <p className="text-muted-foreground mb-6">Convierte solicitudes en citas reales: asigna servicio, empleado y horario.</p>

      {requests.length === 0 ? (
        <div className="rounded-md border p-4 text-sm text-muted-foreground">No hay solicitudes pendientes.</div>
      ) : (
        <RequestsConverter requests={requests} services={svcList} />
      )}
    </div>
  );
}