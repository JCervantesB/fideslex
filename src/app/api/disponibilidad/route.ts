import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles, schedules, appointments, lunchBreaks } from "@/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import { Pool } from "pg";

async function requireAnyAuthenticated() {
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

async function ensureTables() {
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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS appointments (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
      client_id TEXT REFERENCES profiles(user_id) ON DELETE SET NULL,
      client_name VARCHAR(120),
      client_email VARCHAR(120),
      start_at TIMESTAMPTZ NOT NULL,
      end_at TIMESTAMPTZ NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pendiente',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS appointments_user_start_idx ON appointments(user_id, start_at);
  `);
}

async function ensureLunchBreaksTable() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS lunch_breaks (
      user_id TEXT PRIMARY KEY REFERENCES profiles(user_id) ON DELETE CASCADE,
      start_min INTEGER NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

function toDayRange(dateStr: string) {
  // Usar medianoche local en vez de UTC para evitar desfase horario
  const start = new Date(`${dateStr}T00:00:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export async function GET(req: Request) {
  try {
    const authz = await requireAnyAuthenticated();
    if ("error" in authz) return authz.error;
    await ensureTables();
    await ensureLunchBreaksTable();

    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const date = url.searchParams.get("date");

    if (!userId || !date) {
      return NextResponse.json({ error: "Faltan parámetros userId y date (YYYY-MM-DD)" }, { status: 400 });
    }

    const { start: dayStart, end: dayEnd } = toDayRange(date);

    // Restringir a lunes–viernes usando día local
    const dow = dayStart.getDay();
    if (dow === 0 || dow === 6) {
      return NextResponse.json({ ok: true, slots: [] });
    }

    // Obtener hora de comida del profesional (si existe)
    const [lb] = await db.select().from(lunchBreaks).where(eq(lunchBreaks.userId, userId));
    const lunchStartMin = lb?.startMin ?? null;
    const lunchEndMin = lunchStartMin != null ? lunchStartMin + 60 : null;

    const avail = await db.select().from(schedules);
    // Filtrar a 30min entre 09:00–16:00 por seguridad
    const base = avail.filter(
      (a) => (a.endMin - a.startMin) === 30 && a.startMin >= 540 && a.endMin <= 960
    );

    const existing = await db
      .select()
      .from(appointments)
      .where(and(eq(appointments.userId, userId), gte(appointments.startAt, dayStart), lt(appointments.startAt, dayEnd)));

    const bookedMs = new Set<number>(existing.map((a) => new Date(a.startAt as Date | string | number).getTime()));

    const slots: Array<{ start: string; end: string }> = [];
    for (const a of base) {
      // Excluir slots dentro de la hora de comida (dos bloques de 30m)
      if (lunchStartMin != null && a.startMin >= lunchStartMin && a.startMin < (lunchEndMin as number)) {
        continue;
      }
      const startMs = dayStart.getTime() + a.startMin * 60 * 1000;
      if (bookedMs.has(startMs)) continue;
      const endMs = dayStart.getTime() + a.endMin * 60 * 1000;
      slots.push({ start: new Date(startMs).toISOString(), end: new Date(endMs).toISOString() });
    }

    return NextResponse.json({ ok: true, slots });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("GET /api/disponibilidad error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}