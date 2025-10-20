import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Pool } from "pg";

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

export default async function NotificationsHistoryPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in");
  const userId = session.user.id;

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
  if (!profile || (profile.role !== "usuario" && profile.role !== "administrador")) {
    redirect("/dashboard/cliente");
  }

  await ensureNotificationsTable();

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const res = await pool.query(
    `SELECT id, type, title, body, link_url, case_id, created_at, read_at
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 100`,
    [userId]
  );

  const items = res.rows.map((r) => ({
    id: Number(r.id),
    type: String(r.type),
    title: String(r.title),
    body: r.body ? String(r.body) : null,
    linkUrl: r.link_url ? String(r.link_url) : null,
    caseId: r.case_id === null || r.case_id === undefined ? null : Number(r.case_id),
    createdAt: (r.created_at as Date).toISOString(),
    readAt: r.read_at ? (r.read_at as Date).toISOString() : null,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Historial de notificaciones</h1>
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">Volver al dashboard</Link>
      </div>
      {items.length === 0 ? (
        <div className="text-sm text-muted-foreground">No hay notificaciones registradas.</div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {items.map((it) => (
            <li key={it.id} className="p-3 flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{it.title}</span>
                  {it.readAt === null ? (
                    <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-900">No leída</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-900">Leída</span>
                  )}
                </div>
                {it.body && (
                  <div className="text-sm text-muted-foreground mt-1">{it.body}</div>
                )}
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(it.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {it.linkUrl && (
                  <Link href={it.linkUrl} className="text-sm px-3 py-1.5 rounded border hover:bg-muted transition-colors">Abrir caso</Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}