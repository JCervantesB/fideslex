import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles, cases, caseDocuments, appointments } from "@/db/schema";
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

async function requireUsuarioOrAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { error: NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 }) };
  }
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!profile || (profile.role !== "usuario" && profile.role !== "administrador")) {
    return { error: NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 }) };
  }
  return { session, profile };
}

export async function GET(req: Request) {
  try {
    const authz = await requireUsuarioOrAdmin();
    if ("error" in authz) return authz.error;
    await ensureCasesTables();

    const url = new URL(req.url);
    const clientId = url.searchParams.get("clientId");

    let rows;
    if (clientId) {
      rows = await db.select().from(cases).where(eq(cases.clientId, clientId));
    } else {
      rows = await db.select().from(cases).where(eq(cases.userId, authz.session.user.id));
    }

    return NextResponse.json({ ok: true, items: rows });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("GET /api/casos error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authz = await requireUsuarioOrAdmin();
    if ("error" in authz) return authz.error;
    await ensureCasesTables();

    const body = await req.json();
    const { nombre, asunto, descripcion, clientId, appointmentId } = body || {};
    if (!nombre || !asunto || !clientId) {
      return NextResponse.json({ ok: false, error: "Campos requeridos: nombre, asunto, clientId" }, { status: 400 });
    }

    const [clientProfile] = await db.select().from(profiles).where(eq(profiles.userId, clientId));
    if (!clientProfile || clientProfile.role !== "cliente") {
      return NextResponse.json({ ok: false, error: "Cliente inválido" }, { status: 400 });
    }

    // Validar y normalizar appointmentId: solo guardar si existe
    let safeAppointmentId: number | null = null;
    if (appointmentId !== undefined && appointmentId !== null && String(appointmentId).trim() !== "") {
      const maybeId = Number(appointmentId);
      if (!Number.isNaN(maybeId)) {
        const [existingAppointment] = await db.select().from(appointments).where(eq(appointments.id, maybeId));
        if (existingAppointment) {
          safeAppointmentId = maybeId;
        }
      }
    }

    const inserted = await db
      .insert(cases)
      .values({
        userId: authz.session.user.id,
        clientId,
        appointmentId: safeAppointmentId,
        nombre,
        asunto,
        descripcion: descripcion || null,
      })
      .returning();

    // Vincular documentos subidos durante la creación del caso
    const files: Array<{ key: string; name: string; url: string }> = Array.isArray(body?.files) ? body.files : [];
    if (files.length > 0) {
      const caseId = inserted[0].id as number;
      const values = files
        .filter((f) => f?.key && f?.name && f?.url)
        .map((f) => ({ caseId, fileKey: f.key, fileName: f.name, fileUrl: f.url, uploadedBy: authz.session.user.id }));
      if (values.length > 0) {
        await db.insert(caseDocuments).values(values);
      }
    }

    return NextResponse.json({ ok: true, item: inserted[0] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("POST /api/casos error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}