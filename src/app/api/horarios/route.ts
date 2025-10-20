import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles, schedules } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Pool } from "pg";

async function requireUserOrAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!profile || (profile.role !== "usuario" && profile.role !== "administrador")) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 403 }) };
  }
  return { session, profile };
}

async function ensureSchedulesTable() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schedules (
      id SERIAL PRIMARY KEY,
      start_min INTEGER NOT NULL,
      end_min INTEGER NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS schedules_start_end_unique ON schedules(start_min, end_min);
  `);
}

export async function GET(_req: Request) {
  try {
    const authz = await requireUserOrAdmin();
    if ("error" in authz) return authz.error;
    await ensureSchedulesTable();

    const rows = await db.select().from(schedules);
    return NextResponse.json({ ok: true, items: rows });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("GET /api/horarios error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authz = await requireUserOrAdmin();
    if ("error" in authz) return authz.error;
    await ensureSchedulesTable();

    if (authz.profile.role !== "administrador") {
      return NextResponse.json({ error: "Solo administradores pueden modificar horarios globales" }, { status: 403 });
    }

    const body = await req.json();
    const { startMin, endMin } = body || {};

    if (typeof startMin !== "number" || typeof endMin !== "number") {
      return NextResponse.json({ error: "startMin y endMin deben ser números" }, { status: 400 });
    }
    if (startMin % 30 !== 0 || endMin % 30 !== 0) {
      return NextResponse.json({ error: "startMin y endMin deben ser múltiplos de 30" }, { status: 400 });
    }
    if (startMin < 540 || endMin > 960 || endMin <= startMin) {
      return NextResponse.json({ error: "Rango horario inválido (solo 09:00–16:00)" }, { status: 400 });
    }

    const [row] = await db
      .insert(schedules)
      .values({ startMin, endMin })
      .returning();

    return NextResponse.json({ ok: true, item: row });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("POST /api/horarios error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}