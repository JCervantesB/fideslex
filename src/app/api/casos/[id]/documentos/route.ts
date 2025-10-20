import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles, cases, caseDocuments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Pool } from "pg";

async function ensureCaseDocumentsTable() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS case_documents (
      id SERIAL PRIMARY KEY,
      case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
      file_key TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      uploaded_by TEXT NOT NULL REFERENCES profiles(user_id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

async function requireAuthenticated() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!profile) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 403 }) };
  }
  return { session, profile };
}

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authz = await requireAuthenticated();
    if ("error" in authz) return authz.error;
    await ensureCaseDocumentsTable();

    const { id: idStr } = await context.params;
    const caseId = Number(idStr);
    if (Number.isNaN(caseId)) {
      return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
    }

    const [item] = await db.select().from(cases).where(eq(cases.id, caseId));
    if (!item) return NextResponse.json({ ok: false, error: "Caso no encontrado" }, { status: 404 });

    const role = authz.profile.role as string;
    const userId = authz.session.user.id as string;
    const isAllowed =
      role === "administrador" ||
      (role === "usuario" && item.userId === userId) ||
      (role === "cliente" && item.clientId === userId);
    if (!isAllowed) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
    }

    const docs = await db.select().from(caseDocuments).where(eq(caseDocuments.caseId, caseId));
    return NextResponse.json({ ok: true, items: docs });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("GET /api/casos/[id]/documentos error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authz = await requireAuthenticated();
    if ("error" in authz) return authz.error;
    await ensureCaseDocumentsTable();

    const { id: idStr } = await context.params;
    const caseId = Number(idStr);
    if (Number.isNaN(caseId)) {
      return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
    }

    const [item] = await db.select().from(cases).where(eq(cases.id, caseId));
    if (!item) return NextResponse.json({ ok: false, error: "Caso no encontrado" }, { status: 404 });

    const role = authz.profile.role as string;
    const userId = authz.session.user.id as string;
    const isAllowed =
      role === "administrador" ||
      (role === "usuario" && item.userId === userId) ||
      (role === "cliente" && item.clientId === userId);
    if (!isAllowed) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const { fileKey, fileName, fileUrl } = body || {};
    if (!fileKey || !fileName || !fileUrl) {
      return NextResponse.json({ ok: false, error: "Campos requeridos: fileKey, fileName, fileUrl" }, { status: 400 });
    }

    const inserted = await db
      .insert(caseDocuments)
      .values({ caseId, fileKey, fileName, fileUrl, uploadedBy: authz.session.user.id })
      .returning();

    return NextResponse.json({ ok: true, item: inserted[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("POST /api/casos/[id]/documentos error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}