import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles, cases, appointments } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { Pool } from "pg";
import { sendEmail } from "@/lib/email";

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

async function ensureCaseMessagesTable() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS case_messages (
      id SERIAL PRIMARY KEY,
      case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
      author_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS case_messages_case_idx ON case_messages(case_id);
    CREATE INDEX IF NOT EXISTS case_messages_created_idx ON case_messages(created_at);
  `);
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

function isAllowedToAccessCase(role: string, userId: string, item: typeof cases.$inferSelect) {
  return (
    role === "administrador" ||
    (role === "usuario" && item.userId === userId) ||
    (role === "cliente" && item.clientId === userId)
  );
}

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authz = await requireAnyAuthenticated();
    if ("error" in authz) return authz.error;
    await ensureCaseMessagesTable();

    const { id: idStr } = await context.params;
    const caseId = Number(idStr);
    if (Number.isNaN(caseId)) {
      return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
    }

    const [item] = await db.select().from(cases).where(eq(cases.id, caseId));
    if (!item) return NextResponse.json({ ok: false, error: "Caso no encontrado" }, { status: 404 });

    const role = authz.profile.role as string;
    const userId = authz.session.user.id as string;
    if (!isAllowedToAccessCase(role, userId, item)) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const res = await pool.query(
      `SELECT m.id, m.content, m.created_at, m.author_id, p.first_name, p.last_name, p.role
       FROM case_messages m
       INNER JOIN profiles p ON p.user_id = m.author_id
       WHERE m.case_id = $1
       ORDER BY m.created_at ASC`,
      [caseId]
    );

    const items = res.rows.map((r) => ({
      id: r.id as number,
      content: String(r.content),
      createdAt: (r.created_at as Date).toISOString(),
      authorId: String(r.author_id),
      authorName: `${r.first_name ?? ""}${r.last_name ? ` ${r.last_name}` : ""}`.trim(),
      authorRole: String(r.role),
    }));

    return NextResponse.json({ ok: true, items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("GET /api/casos/[id]/mensajes error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authz = await requireAnyAuthenticated();
    if ("error" in authz) return authz.error;
    await ensureCaseMessagesTable();

    const { id: idStr } = await context.params;
    const caseId = Number(idStr);
    if (Number.isNaN(caseId)) {
      return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
    }

    const [item] = await db.select().from(cases).where(eq(cases.id, caseId));
    if (!item) return NextResponse.json({ ok: false, error: "Caso no encontrado" }, { status: 404 });

    const role = authz.profile.role as string;
    const userId = authz.session.user.id as string;
    if (!isAllowedToAccessCase(role, userId, item)) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const content = String(body?.content || "").trim();
    if (!content) {
      return NextResponse.json({ ok: false, error: "Contenido requerido" }, { status: 400 });
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const ins = await pool.query(
      `INSERT INTO case_messages (case_id, author_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, content, created_at`,
      [caseId, userId, content]
    );
    const row = ins.rows[0];

    const itemOut = {
      id: row.id as number,
      content: String(row.content),
      createdAt: (row.created_at as Date).toISOString(),
      authorId: userId,
      authorName: `${authz.profile.firstName ?? ""}${authz.profile.lastName ? ` ${authz.profile.lastName}` : ""}`.trim(),
      authorRole: role,
    };

    // Notificación en dashboard para el usuario cuando el autor es cliente
    if (role === "cliente") {
      try {
        await ensureNotificationsTable();
        const caseName = String(item.nombre || item.asunto || `Caso #${caseId}`);
        const preview = content.length > 140 ? content.slice(0, 140) + "…" : content;
        await pool.query(
          `INSERT INTO notifications (user_id, type, title, body, link_url, case_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [String(item.userId), "case_message", `Nuevo mensaje en caso: ${caseName}`, preview, `/dashboard/usuario/casos/${caseId}`, caseId]
        );
      } catch (notifyErr) {
        const message = notifyErr instanceof Error ? notifyErr.message : String(notifyErr);
        console.warn("Fallo creando notificación de mensaje de cliente:", message);
      }
    }

    // Notificar por email al cliente si el autor es usuario o administrador
    if (role === "usuario" || role === "administrador") {
      try {
        // Intentar obtener correo del cliente desde la cita más reciente vinculada al mismo usuario/cliente
        let clientEmail: string | null = null;
        let clientName: string | null = null;

        const recentAppt = await db
          .select({ clientEmail: appointments.clientEmail, clientName: appointments.clientName, startAt: appointments.startAt })
          .from(appointments)
          .where(and(eq(appointments.clientId, item.clientId as string), eq(appointments.userId, item.userId as string)))
          .orderBy(desc(appointments.startAt))
          .limit(1);

        if (recentAppt && recentAppt.length > 0) {
          clientEmail = (recentAppt[0].clientEmail as string | null) || null;
          clientName = (recentAppt[0].clientName as string | null) || null;
        }

        // Fallback para nombre y correo usando perfil si no hay datos en la cita
        const [clientProfile] = await db.select().from(profiles).where(eq(profiles.userId, item.clientId as string));
        if (clientProfile) {
          if (!clientName) {
            clientName = `${clientProfile.firstName ?? ""}${clientProfile.lastName ? ` ${clientProfile.lastName}` : ""}`.trim();
          }
          const emailFromProfile = (clientProfile as { email?: string }).email;
          if (!clientEmail && emailFromProfile) {
            clientEmail = String(emailFromProfile);
          }
        }

        if (clientEmail) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
          const caseName = String(item.nombre || item.asunto || "");
          const subject = `Nuevo mensaje en su caso: ${caseName.trim() || "Fideslex"}`;
          const preview = content.length > 140 ? content.slice(0, 140) + "…" : content;
          const text = `Hola${clientName ? ` ${clientName}` : ""},\n\nTiene un nuevo mensaje en su caso "${caseName || `#${caseId}`}".\n\nMensaje:\n${content}\n\nPuede revisar el detalle en: ${appUrl}/dashboard/cliente/casos/${caseId}\n\nUn saludo,\nFídex Lex`;
          const html = `
            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111;line-height:1.6;max-width:600px;margin:auto;padding:20px;">
              <h2 style="margin:0 0 12px;font-weight:600;color:#000;">Nuevo mensaje en su caso</h2>
              <p style="margin:4px 0;font-size:16px;">Hola${clientName ? ` ${clientName}` : ""},</p>
              <p style="margin:8px 0 12px;font-size:16px;">Tiene un nuevo mensaje en su caso <strong>${caseName || `#${caseId}`}</strong>.</p>
              <blockquote style="margin:12px 0;padding:12px;border-left:4px solid #ccc;background:#fafafa;">${preview.replace(/</g, "&lt;")}</blockquote>
              <p style="margin:12px 0;font-size:16px;">Revise el detalle aquí: <a href="${appUrl}/dashboard/cliente/casos/${caseId}">${appUrl}/dashboard/cliente/casos/${caseId}</a></p>
              <p style="margin-top:16px;font-size:16px;">Un saludo,<br/><strong>Fídex Lex</strong></p>
            </div>
          `;

          await sendEmail({ to: clientEmail, subject, text, html });
        } else {
          console.warn("No se pudo enviar notificación: correo del cliente no disponible para caso", caseId);
        }
      } catch (notifyErr) {
        const message = notifyErr instanceof Error ? notifyErr.message : String(notifyErr);
        console.warn("Fallo enviando notificación de nuevo mensaje:", message);
      }
    }

    return NextResponse.json({ ok: true, item: itemOut });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("POST /api/casos/[id]/mensajes error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}