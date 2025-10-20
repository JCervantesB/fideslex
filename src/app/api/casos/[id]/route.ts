import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles, cases } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Pool } from "pg";

async function ensureCasesTables() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cases (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(user_id),
      client_id TEXT NOT NULL REFERENCES profiles(user_id),
      appointment_id INTEGER REFERENCES appointments(id),
      nombre VARCHAR(120) NOT NULL,
      asunto VARCHAR(200) NOT NULL,
      descripcion TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

async function requireUsuarioOrAdmin() {
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

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authz = await requireUsuarioOrAdmin();
    if ("error" in authz) return authz.error;
    await ensureCasesTables();

    const { id: idStr } = await context.params;
    const id = Number(idStr);
    if (Number.isNaN(id)) {
      return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
    }

    const [item] = await db.select().from(cases).where(eq(cases.id, id));
    if (!item) return NextResponse.json({ ok: false, error: "Caso no encontrado" }, { status: 404 });

    // Solo propietario (usuario) o admin
    if (authz.profile.role !== "administrador" && item.userId !== authz.session.user.id) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
    }

    return NextResponse.json({ ok: true, item });
  } catch (err: any) {
    console.error("GET /api/casos/[id] error:", err?.message || err);
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authz = await requireUsuarioOrAdmin();
    if ("error" in authz) return authz.error;
    await ensureCasesTables();

    const { id: idStr } = await context.params;
    const id = Number(idStr);
    if (Number.isNaN(id)) {
      return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
    }

    const [item] = await db.select().from(cases).where(eq(cases.id, id));
    if (!item) return NextResponse.json({ ok: false, error: "Caso no encontrado" }, { status: 404 });
    if (authz.profile.role !== "administrador" && item.userId !== authz.session.user.id) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const { nombre, asunto, descripcion, clientId, appointmentId } = body || {};

    const updated = await db
      .update(cases)
      .set({
        nombre: nombre ?? item.nombre,
        asunto: asunto ?? item.asunto,
        descripcion: descripcion ?? item.descripcion,
        clientId: clientId ?? item.clientId,
        appointmentId: appointmentId !== undefined ? Number(appointmentId) : item.appointmentId,
        updatedAt: new Date(),
      })
      .where(eq(cases.id, id))
      .returning();

    return NextResponse.json({ ok: true, item: updated[0] });
  } catch (err: any) {
    console.error("PUT /api/casos/[id] error:", err?.message || err);
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authz = await requireUsuarioOrAdmin();
    if ("error" in authz) return authz.error;
    await ensureCasesTables();

    const { id: idStr } = await context.params;
    const id = Number(idStr);
    if (Number.isNaN(id)) {
      return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
    }

    const [item] = await db.select().from(cases).where(eq(cases.id, id));
    if (!item) return NextResponse.json({ ok: false, error: "Caso no encontrado" }, { status: 404 });
    if (authz.profile.role !== "administrador" && item.userId !== authz.session.user.id) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
    }

    await db.delete(cases).where(eq(cases.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("DELETE /api/casos/[id] error:", err?.message || err);
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}