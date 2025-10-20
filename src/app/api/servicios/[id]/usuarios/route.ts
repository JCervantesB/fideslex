import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles, serviceAssignees } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Pool } from "pg";

async function ensureServiceAssigneesTable() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS service_assignees (
      service_id INTEGER NOT NULL,
      user_id TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (service_id, user_id),
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE
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

// Permitir a cualquier usuario autenticado consultar profesionales asignados a un servicio
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

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const authz = await requireAuthenticated();
    if ("error" in authz) return authz.error;

    await ensureServiceAssigneesTable();

    const { id } = await ctx.params;
    const serviceId = Number(id);
    if (Number.isNaN(serviceId)) {
      return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
    }

    const rows = await db
      .select({
        userId: serviceAssignees.userId,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        role: profiles.role,
      })
      .from(serviceAssignees)
      .innerJoin(profiles, eq(serviceAssignees.userId, profiles.userId))
      .where(eq(serviceAssignees.serviceId, serviceId));

    return NextResponse.json({ ok: true, items: rows });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("GET /api/servicios/[id]/usuarios error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const authz = await requireAdmin();
    if ("error" in authz) return authz.error;

    await ensureServiceAssigneesTable();

    const { id } = await ctx.params;
    const serviceId = Number(id);
    if (Number.isNaN(serviceId)) {
      return NextResponse.json({ ok: false, error: "ID de servicio inválido" }, { status: 400 });
    }
    const body = await req.json();
    const userId: string | undefined = body?.userId;
    if (!userId) {
      return NextResponse.json({ ok: false, error: "'userId' es requerido" }, { status: 400 });
    }

    const [userProfile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    if (!userProfile) {
      return NextResponse.json({ ok: false, error: "Usuario no existe" }, { status: 404 });
    }
    if (userProfile.role !== "usuario" && userProfile.role !== "administrador") {
      return NextResponse.json({ ok: false, error: "Solo se pueden asignar usuarios o administradores" }, { status: 400 });
    }

    await db
      .insert(serviceAssignees)
      .values({ serviceId: serviceId, userId })
      .onConflictDoNothing();

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("POST /api/servicios/[id]/usuarios error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}