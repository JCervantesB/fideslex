import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles, serviceAssignees } from "@/db/schema";
import { eq } from "drizzle-orm";
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

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authz = await requireAnyAuthenticated();
    if ("error" in authz) return authz.error;

    await ensureServiceAssigneesTable();

    const { id: idStr } = await context.params;
    const id = Number(idStr);
    if (Number.isNaN(id)) {
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
      .where(eq(serviceAssignees.serviceId, id));

    const items = rows.filter((r) => r.role === "usuario" || r.role === "administrador");

    return NextResponse.json({ ok: true, items });
  } catch (err: any) {
    console.error("GET /api/servicios/[id]/profesionales error:", err?.message || err);
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}