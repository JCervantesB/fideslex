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

export async function GET(req: Request) {
  try {
    const authz = await requireAnyAuthenticated();
    if ("error" in authz) return authz.error;
    await ensureNotificationsTable();

    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "unread"; // unread | all | read
    const limit = Math.min(Number(url.searchParams.get("limit") || 20), 100);

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    let query = `SELECT id, type, title, body, link_url, case_id, created_at
                 FROM notifications
                 WHERE user_id = $1`;
    const params: any[] = [authz.session.user.id];

    if (status === "unread") {
      query += ` AND read_at IS NULL`;
    } else if (status === "read") {
      query += ` AND read_at IS NOT NULL`;
    }
    query += ` ORDER BY created_at DESC LIMIT $2`;
    params.push(limit);

    const res = await pool.query(query, params);

    const items = res.rows.map((r) => ({
      id: r.id as number,
      type: String(r.type),
      title: String(r.title),
      body: r.body ? String(r.body) : null,
      linkUrl: r.link_url ? String(r.link_url) : null,
      caseId: r.case_id === null || r.case_id === undefined ? null : Number(r.case_id),
      createdAt: (r.created_at as Date).toISOString(),
    }));

    return NextResponse.json({ ok: true, items });
  } catch (err: any) {
    console.error("GET /api/notificaciones error:", err?.message || err);
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}