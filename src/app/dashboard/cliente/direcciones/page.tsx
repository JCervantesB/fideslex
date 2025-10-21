import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ClientAddressView } from "./ClientAddressView";

export default async function ClienteDireccionesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!profile) {
    redirect("/sign-in");
  }

  // Los clientes pueden ver las direcciones, pero no editarlas
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-2">Direcciones Disponibles</h1>
      <p className="text-muted-foreground mb-6">
        Consulta las direcciones disponibles para tus citas y servicios.
      </p>
      
      <ClientAddressView />
    </div>
  );
}