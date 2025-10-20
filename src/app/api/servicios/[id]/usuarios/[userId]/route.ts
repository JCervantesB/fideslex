import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles, serviceAssignees } from "@/db/schema";
import { eq, and } from "drizzle-orm";
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

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string; userId: string }> }) {
  try {
    const authz = await requireAdmin();
    if ("error" in authz) return authz.error;

    await ensureServiceAssigneesTable();

    const { id, userId } = await ctx.params;
    const serviceId = Number(id);
    if (Number.isNaN(serviceId) || !userId) {
      return NextResponse.json({ ok: false, error: "Parámetros inválidos" }, { status: 400 });
    }

    const [deleted] = await db
      .delete(serviceAssignees)
      .where(and(eq(serviceAssignees.serviceId, serviceId), eq(serviceAssignees.userId, userId)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ ok: false, error: "No encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("DELETE /api/servicios/[id]/usuarios/[userId] error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}