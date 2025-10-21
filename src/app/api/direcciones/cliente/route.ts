import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { addresses, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

async function requireClientAuth() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!profile) {
    return { error: NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 }) };
  }
  // Los clientes solo pueden ver, no necesitan ser administradores
  return { session, profile };
}

export async function GET() {
  try {
    const authz = await requireClientAuth();
    if ("error" in authz) return authz.error;

    // Los clientes pueden ver todas las direcciones (para seleccionar en citas, etc.)
    // Si necesitas filtrar por algún criterio específico, puedes modificar esta consulta
    const rows = await db
      .select({
        id: addresses.id,
        nombre: addresses.nombre,
        direccion: addresses.direccion,
        createdAt: addresses.createdAt
      })
      .from(addresses);
    
    return NextResponse.json({ ok: true, items: rows });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("GET /api/direcciones/cliente error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}