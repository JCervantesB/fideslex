import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles, appointmentRequests } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Pool } from "pg";

async function ensureAppointmentRequestsTable() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS appointment_requests (
      id SERIAL PRIMARY KEY,
      service_name VARCHAR(120) NOT NULL,
      client_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
      client_name VARCHAR(120) NOT NULL,
      client_email VARCHAR(120) NOT NULL,
      client_phone VARCHAR(20) NOT NULL,
      desired_date DATE NOT NULL,
      desired_start_min INTEGER NOT NULL,
      message TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'solicitada',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS appointment_requests_client_idx ON appointment_requests(client_id);
    CREATE INDEX IF NOT EXISTS appointment_requests_date_idx ON appointment_requests(desired_date);
    CREATE INDEX IF NOT EXISTS appointment_requests_created_idx ON appointment_requests(created_at);
  `);
  // Asegurar columnas en tablas ya existentes
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'appointment_requests' AND column_name = 'service_name'
      ) THEN
        ALTER TABLE appointment_requests ADD COLUMN service_name VARCHAR(120);
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'appointment_requests' AND column_name = 'message'
      ) THEN
        ALTER TABLE appointment_requests ADD COLUMN message TEXT;
      END IF;
    END $$;
  `);
  // Permitir client_id NULL para solicitudes de invitado
  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'appointment_requests' AND column_name = 'client_id' AND is_nullable = 'NO'
      ) THEN
        ALTER TABLE appointment_requests ALTER COLUMN client_id DROP NOT NULL;
      END IF;
    END $$;
  `);
}

async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) } as const;
  }
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!profile) {
    return { error: NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 }) } as const;
  }
  return { session, profile } as const;
}

// Autenticación opcional: devuelve perfil si existe, o null si es invitado
async function optionalAuth() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { session: null, profile: null } as const;
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
    if (!profile) return { session: null, profile: null } as const;
    return { session, profile } as const;
  } catch {
    return { session: null, profile: null } as const;
  }
}

export async function GET(req: Request) {
  try {
    const authz = await requireAuth();
    if ("error" in authz) return authz.error;
    const { profile } = authz;

    await ensureAppointmentRequestsTable();

    const url = new URL(req.url);
    const scope = url.searchParams.get("scope") || (profile.role === "cliente" ? "own" : "all");
    const clientIdParam = url.searchParams.get("clientId");
    const limitParam = url.searchParams.get("limit");
    const limit = Math.max(1, Math.min(200, Number(limitParam) || 100));

    const rows = await (
      (profile.role === "cliente" || scope === "own")
        ? db.select().from(appointmentRequests).where(eq(appointmentRequests.clientId, profile.userId))
        : clientIdParam
          ? db.select().from(appointmentRequests).where(eq(appointmentRequests.clientId, clientIdParam))
          : db.select().from(appointmentRequests)
    )
      .orderBy(desc(appointmentRequests.createdAt))
      .limit(limit);

    return NextResponse.json({ ok: true, items: rows });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("GET /api/solicitudes-citas error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { session, profile } = await optionalAuth();

    await ensureAppointmentRequestsTable();

    const body = await req.json();
    const serviceName: string = String(body?.serviceName || "").trim();
    const dateStr: string | null = body?.date ?? null; // YYYY-MM-DD
    const startMin: number | null = body?.startMin ?? null; // minutos desde medianoche
    const message: string | null = typeof body?.message === "string" ? String(body.message).trim() : null;

    // Datos del cliente: tomar del body si está presente; si hay perfil, usarlo como fallback
    const clientId: string | null = body?.clientId ?? (profile?.userId ?? null);
    const clientName: string | null = body?.clientName ?? (profile ? `${profile.firstName} ${profile.lastName}`.trim() : null);
    const clientEmail: string | null = body?.clientEmail ?? (session?.user?.email || null);
    const clientPhone: string | null = body?.clientPhone ?? (profile?.phone ?? null);

    if (!serviceName || !dateStr || startMin == null) {
      return NextResponse.json(
        { ok: false, error: "'serviceName', 'date' y 'startMin' son requeridos" },
        { status: 400 }
      );
    }

    // Validación para invitados: si no hay perfil, exigir datos del cliente
    if (!profile) {
      if (!clientName || !clientEmail || !clientPhone) {
        return NextResponse.json(
          { ok: false, error: "Para invitados, 'clientName', 'clientEmail' y 'clientPhone' son requeridos" },
          { status: 400 }
        );
      }
    }

    // Insertar la solicitud (clientId puede ser NULL para invitados)
    const [inserted] = await db
      .insert(appointmentRequests)
      .values({
        serviceName,
        clientId,
        clientName: clientName!,
        clientEmail: clientEmail!,
        clientPhone: clientPhone!,
        desiredDate: dateStr!,
        desiredStartMin: startMin!,
        message,
        status: "solicitada",
      })
      .returning();

    return NextResponse.json({ ok: true, item: inserted }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("POST /api/solicitudes-citas error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}