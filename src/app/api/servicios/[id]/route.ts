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

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const authz = await requireAdmin();
    if ("error" in authz) return authz.error;

    await ensureServicesTable();

    const { id } = await ctx.params;
    const serviceId = Number(id);
    if (Number.isNaN(serviceId)) {
      return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
    }

    const [row] = await db.select().from(services).where(eq(services.id, serviceId));
    if (!row) {
      return NextResponse.json({ ok: false, error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, item: row });
  } catch (err: any) {
    console.error("GET /api/servicios/[id] error:", err?.message || err);
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const authz = await requireAdmin();
    if ("error" in authz) return authz.error;

    await ensureServicesTable();

    const { id } = await ctx.params;
    const serviceId = Number(id);
    if (Number.isNaN(serviceId)) {
      return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
    }

    const body = await req.json();
    const data: any = {};
    if (body.nombre !== undefined) data.nombre = body.nombre;
    if (body.descripcion !== undefined) data.descripcion = body.descripcion;
    if (body.precio !== undefined) data.precio = String(body.precio);
    if (body.estado !== undefined) data.estado = body.estado;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ ok: false, error: "Sin cambios" }, { status: 400 });
    }

    const [updated] = await db.update(services).set(data).where(eq(services.id, serviceId)).returning();
    if (!updated) {
      return NextResponse.json({ ok: false, error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, item: updated });
  } catch (err: any) {
    console.error("PUT /api/servicios/[id] error:", err?.message || err);
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const authz = await requireAdmin();
    if ("error" in authz) return authz.error;

    await ensureServicesTable();

    const { id } = await ctx.params;
    const serviceId = Number(id);
    if (Number.isNaN(serviceId)) {
      return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
    }

    const [deleted] = await db.delete(services).where(eq(services.id, serviceId)).returning();
    if (!deleted) {
      return NextResponse.json({ ok: false, error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, item: deleted });
  } catch (err: any) {
    console.error("DELETE /api/servicios/[id] error:", err?.message || err);
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}