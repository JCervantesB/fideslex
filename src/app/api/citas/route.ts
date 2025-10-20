import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles, appointments, appointmentServices, lunchBreaks } from "@/db/schema";
import { eq, and, gte, lt, inArray } from "drizzle-orm";
import { Pool } from "pg";

async function requireAuthenticated() {
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

async function ensureAppointmentsTables() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS appointment_services (
      appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
      service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (appointment_id, service_id)
    );
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
  // Interpretar la fecha como medianoche local, no UTC
  const start = new Date(`${dateStr}T00:00:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export async function GET(req: Request) {
  try {
    const authz = await requireAuthenticated();
    if ("error" in authz) return authz.error;
    await ensureAppointmentsTables();

    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const date = url.searchParams.get("date"); // YYYY-MM-DD

    if (!userId || !date) {
      return NextResponse.json({ error: "Faltan parámetros userId y date (YYYY-MM-DD)" }, { status: 400 });
    }

    const { start: dayStart, end: dayEnd } = toDayRange(date);
    const rows = await db
      .select()
      .from(appointments)
      .where(and(eq(appointments.userId, userId), gte(appointments.startAt, dayStart), lt(appointments.startAt, dayEnd)));

    return NextResponse.json({ ok: true, items: rows });
  } catch (err: any) {
    console.error("GET /api/citas error:", err?.message || err);
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authz = await requireAuthenticated();
    if ("error" in authz) return authz.error;
    await ensureAppointmentsTables();
    await ensureLunchBreaksTable();

    const body = await req.json();
    const { userId, date, startMin, services } = body || {};

    if (!userId || !date || typeof startMin !== "number") {
      return NextResponse.json({ error: "Campos requeridos: userId, date (YYYY-MM-DD), startMin" }, { status: 400 });
    }
    if (startMin % 30 !== 0 || startMin < 540 || startMin >= 960) {
      return NextResponse.json({ error: "startMin debe ser múltiplo de 30 y estar entre 09:00–16:00" }, { status: 400 });
    }

    // Bloquear si la franja corresponde a la hora de comida del profesional
    const [lb] = await db.select().from(lunchBreaks).where(eq(lunchBreaks.userId, userId));
    if (lb) {
      const lunchStartMin = lb.startMin;
      const lunchEndMin = lunchStartMin + 60;
      if (startMin >= lunchStartMin && startMin < lunchEndMin) {
        return NextResponse.json({ error: "Horario no disponible: hora de comida del profesional" }, { status: 409 });
      }
    }

    // Calcular inicio/fin desde medianoche local
    const dayStart = new Date(`${date}T00:00:00`);
    const startMs = dayStart.getTime() + startMin * 60 * 1000;
    const endMs = startMs + 30 * 60 * 1000;
    const startAt = new Date(startMs);
    const endAt = new Date(endMs);

    // No permitir programar en el pasado
    const now = new Date();
    if (endAt <= now) {
      return NextResponse.json({ error: "No se puede programar en el pasado" }, { status: 400 });
    }

    const exists = await db
      .select()
      .from(appointments)
      .where(and(eq(appointments.userId, userId), eq(appointments.startAt, startAt)));
    if (exists.length > 0) {
      return NextResponse.json({ error: "Slot ya reservado" }, { status: 409 });
    }

    const payload: any = {
      userId,
      startAt,
      endAt,
      status: "pendiente",
    };

    if (authz.profile.role === "cliente") {
      payload.clientId = authz.session.user.id;
      payload.clientName = authz.session.user.name ?? null;
      payload.clientEmail = authz.session.user.email ?? null;
    }

    const [appt] = await db.insert(appointments).values(payload).returning();

    if (Array.isArray(services) && services.length > 0) {
      const values = services.map((sid: number) => ({ appointmentId: appt.id, serviceId: sid }));
      await db.insert(appointmentServices).values(values);
    }

    return NextResponse.json({ ok: true, item: appt });
  } catch (err: any) {
    console.error("POST /api/citas error:", err?.message || err);
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}