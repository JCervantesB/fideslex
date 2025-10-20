import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function DashboardIndexPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in");

  const userId = session.user.id;
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));

  // Admin debe ir por defecto al dashboard de usuario
  if (profile?.role === "administrador") {
    redirect("/dashboard/usuario");
  }

  if (profile?.role === "usuario") {
    redirect("/dashboard/usuario");
  }

  // Por defecto clientes
  redirect("/dashboard/cliente");
}