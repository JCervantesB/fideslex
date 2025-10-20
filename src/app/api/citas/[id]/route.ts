import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles, appointments } from "@/db/schema";
import { eq } from "drizzle-orm";
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

async function ensureAppointmentsTable() {
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
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const authz = await requireAuthenticated();
    if ("error" in authz) return authz.error;
    await ensureAppointmentsTable();

    const { id } = await ctx.params;
    const apptId = Number(id);
    if (!apptId || Number.isNaN(apptId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const [appt] = await db.select().from(appointments).where(eq(appointments.id, apptId));
    if (!appt) return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });

    const isOwner = appt.userId === authz.session.user.id;
    const isClient = appt.clientId && appt.clientId === authz.session.user.id;
    const isAdmin = authz.profile.role === "administrador";

    if (!isOwner && !isClient && !isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    await db.delete(appointments).where(eq(appointments.id, apptId));
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("DELETE /api/citas/[id] error:", err?.message || err);
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const authz = await requireAuthenticated();
    if ("error" in authz) return authz.error;
    await ensureAppointmentsTable();

    const { id } = await ctx.params;
    const apptId = Number(id);
    if (!apptId || Number.isNaN(apptId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const [appt] = await db.select().from(appointments).where(eq(appointments.id, apptId));
    if (!appt) return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });

    const isOwner = appt.userId === authz.session.user.id;
    const isAdmin = authz.profile.role === "administrador";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const { status } = body || {};
    if (!status || typeof status !== "string") {
      return NextResponse.json({ error: "Campo status requerido" }, { status: 400 });
    }

    const [row] = await db.update(appointments).set({ status }).where(eq(appointments.id, apptId)).returning();
    return NextResponse.json({ ok: true, item: row });
  } catch (err: any) {
    console.error("PUT /api/citas/[id] error:", err?.message || err);
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}