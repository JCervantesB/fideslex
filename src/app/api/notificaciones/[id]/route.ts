import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Pool } from "pg";

async function requireAnyAuthenticated() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { error: NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 }) };
  }
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!profile) {
    return { error: NextResponse.json({ ok: false, error: "Perfil no encontrado" }, { status: 404 }) };
  }
  return { session, profile };
}

async function ensureNotificationsTable() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
      type VARCHAR(60) NOT NULL,
      title VARCHAR(200) NOT NULL,
      body TEXT,
      link_url TEXT,
      case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      read_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS notifications_read_idx ON notifications(read_at);
    CREATE INDEX IF NOT EXISTS notifications_created_idx ON notifications(created_at);
  `);
}

export async function PATCH(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authz = await requireAnyAuthenticated();
    if ("error" in authz) return authz.error;
    await ensureNotificationsTable();

    const { id: idStr } = await context.params;
    const id = Number(idStr);
    if (Number.isNaN(id)) {
      return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const res = await pool.query(
      `UPDATE notifications SET read_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [id, authz.session.user.id]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ ok: false, error: "No encontrado o no autorizado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("PATCH /api/notificaciones/[id] error:", err?.message || err);
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}