import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles, appointments, appointmentRequests } from "@/db/schema";
import { eq, desc, and, isNotNull } from "drizzle-orm";
import { Pool } from "pg";

async function requireAuthorized() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) } as const;
  }
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!profile || (profile.role !== "usuario" && profile.role !== "administrador")) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 403 }) } as const;
  }
  return { session, profile } as const;
}

async function ensureTables() {
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
    CREATE TABLE IF NOT EXISTS appointment_requests (
      id SERIAL PRIMARY KEY,
      service_name VARCHAR(120) NOT NULL,
      client_id TEXT REFERENCES profiles(user_id) ON DELETE CASCADE,
      client_name VARCHAR(120) NOT NULL,
      client_email VARCHAR(120) NOT NULL,
      client_phone VARCHAR(20) NOT NULL,
      desired_date DATE NOT NULL,
      desired_start_min INTEGER NOT NULL,
      message TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'solicitada',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

export async function GET(req: Request) {
  try {
    const authz = await requireAuthorized();
    if ("error" in authz) return authz.error;

    await ensureTables();

    const url = new URL(req.url);
    const email = url.searchParams.get("email");
    if (!email) {
      return NextResponse.json({ ok: false, error: "Falta 'email'" }, { status: 400 });
    }

    // Buscar por email en citas (registro más reciente)
    const apptRows = await db
      .select({ clientId: appointments.clientId, clientName: appointments.clientName, clientEmail: appointments.clientEmail, createdAt: appointments.createdAt })
      .from(appointments)
      .where(eq(appointments.clientEmail, email))
      .orderBy(desc(appointments.createdAt))
      .limit(1);

    let clientId: string | null = (apptRows[0]?.clientId as string | null) ?? null;

    // Si no hay coincidencia en citas, buscar en solicitudes con client_id ya enlazado (más reciente)
    if (!clientId) {
      const reqRows = await db
        .select({ clientId: appointmentRequests.clientId, updatedAt: appointmentRequests.updatedAt })
        .from(appointmentRequests)
        .where(and(eq(appointmentRequests.clientEmail, email), isNotNull(appointmentRequests.clientId)))
        .orderBy(desc(appointmentRequests.updatedAt))
        .limit(1);
      clientId = (reqRows[0]?.clientId as string | null) ?? null;
    }

    if (!clientId) {
      return NextResponse.json({ ok: true, item: null });
    }

    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, clientId));
    if (!profile) {
      return NextResponse.json({ ok: true, item: { userId: clientId, email } });
    }

    const item = {
      userId: profile.userId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
      role: profile.role,
      email,
    };

    return NextResponse.json({ ok: true, item });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("GET /api/clientes/lookup error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}