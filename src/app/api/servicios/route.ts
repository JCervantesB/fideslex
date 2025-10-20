import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles, services } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Pool } from "pg";

async function ensureServicesTable() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS services (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(120) NOT NULL,
      descripcion TEXT,
      precio NUMERIC(10,2) NOT NULL DEFAULT 0,
      estado VARCHAR(20) NOT NULL DEFAULT 'activo',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!profile || profile.role !== "administrador") {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 403 }) };
  }
  return { session, profile };
}

export async function GET() {
  try {
    const authz = await requireAdmin();
    if ("error" in authz) return authz.error;

    await ensureServicesTable();
    const rows = await db.select().from(services);
    return NextResponse.json({ ok: true, items: rows });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("GET /api/servicios error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authz = await requireAdmin();
    if ("error" in authz) return authz.error;

    await ensureServicesTable();

    const body = await req.json();
    const nombre: string = body?.nombre || "";
    const descripcion: string | null = body?.descripcion ?? null;
    const precioValue = body?.precio;
    const estado: string = body?.estado || "activo";

    if (!nombre || precioValue === undefined || precioValue === null) {
      return NextResponse.json({ ok: false, error: "'nombre' y 'precio' son requeridos" }, { status: 400 });
    }

    // Asegurar formato numérico como string para Drizzle numeric
    const precio = String(precioValue);

    const [inserted] = await db
      .insert(services)
      .values({ nombre, descripcion, precio, estado })
      .returning();

    return NextResponse.json({ ok: true, item: inserted }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("POST /api/servicios error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}