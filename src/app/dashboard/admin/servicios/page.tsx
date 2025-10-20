import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import ServiciosCategoriasTabs from "@/components/dashboard/admin/ServiciosCategoriasTabs";

export default async function AdminServiciosPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in");
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!profile || profile.role !== "administrador") {
    // Si no es admin, lo mandamos al índice de dashboard que re-ruta según rol
    redirect("/dashboard");
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Servicios (Admin)</h1>
      <p className="text-gray-600 mb-4">Gestiona los servicios y categorías.</p>
      <ServiciosCategoriasTabs />
    </div>
  );
}