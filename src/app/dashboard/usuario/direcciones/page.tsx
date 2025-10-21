import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AddressDirectory } from "./AddressDirectory";

export default async function UsuarioDireccionesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!profile || (profile.role !== "usuario" && profile.role !== "administrador")) {
    redirect("/dashboard/cliente");
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-2">Directorio de Direcciones</h1>
      <p className="text-muted-foreground mb-6">
        Gestiona tus direcciones guardadas para facilitar la programación de citas.
      </p>
      
      <AddressDirectory />
    </div>
  );
}