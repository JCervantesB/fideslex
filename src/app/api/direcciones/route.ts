import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { addresses, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!profile) {
    return { error: NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 }) };
  }
  return { session, profile };
}

export async function GET() {
  try {
    const authz = await requireAuth();
    if ("error" in authz) return authz.error;

    const rows = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, authz.session.user.id));
    
    return NextResponse.json({ ok: true, items: rows });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("GET /api/direcciones error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authz = await requireAuth();
    if ("error" in authz) return authz.error;

    const body = await req.json();
    const nombre: string | undefined = body?.nombre;
    const direccion: string | undefined = body?.direccion;
    
    if (!nombre || nombre.trim().length === 0) {
      return NextResponse.json({ ok: false, error: "'nombre' es requerido" }, { status: 400 });
    }
    
    if (!direccion || direccion.trim().length === 0) {
      return NextResponse.json({ ok: false, error: "'direccion' es requerida" }, { status: 400 });
    }

    const inserted = await db
      .insert(addresses)
      .values({ 
        userId: authz.session.user.id,
        nombre: nombre.trim(), 
        direccion: direccion.trim() 
      })
      .returning({ id: addresses.id });

    return NextResponse.json({ ok: true, id: inserted[0].id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("POST /api/direcciones error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}