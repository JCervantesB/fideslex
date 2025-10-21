import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { profiles, appointmentRequests, appointments, appointmentServices, services, serviceAssignees, lunchBreaks } from "@/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import { Pool } from "pg";
import { randomBytes } from "crypto";

async function requireAuthorized() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) } as const;
  }
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!profile || (profile.role !== "usuario" && profile.role !== "administrador")) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 403 }) } as const;
  }
  return { session, profile } as const;
}

async function ensureTables() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS appointments (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
      client_id TEXT REFERENCES profiles(user_id) ON DELETE SET NULL,
      client_name VARCHAR(120),
      client_email VARCHAR(120),
      start_at TIMESTAMPTZ NOT NULL,
      end_at TIMESTAMPTZ NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pendiente',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS appointments_user_start_idx ON appointments(user_id, start_at);
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS appointment_services (
      appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
      service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (appointment_id, service_id)
    );
  `);
}

async function ensureLunchBreaksTable() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS lunch_breaks (
      user_id TEXT PRIMARY KEY REFERENCES profiles(user_id) ON DELETE CASCADE,
      start_min INTEGER NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

function toDayRange(dateStr: string) {
  const start = new Date(`${dateStr}T00:00:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

function generatePassword(length = 12) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  const bytes = randomBytes(length);
  let pwd = "";
  for (let i = 0; i < length; i++) {
    pwd += charset[bytes[i] % charset.length];
  }
  return pwd;
}

export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authz = await requireAuthorized();
    if ("error" in authz) return authz.error;

    await ensureTables();
    await ensureLunchBreaksTable();

    const { id: idStr } = await context.params;
    const id = Number(idStr);
    if (Number.isNaN(id)) {
      return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
    }

    const body = await _req.json();
    const serviceId: number | undefined = body?.serviceId;
    const userId: string | undefined = body?.userId;
    const date: string | undefined = body?.date; // YYYY-MM-DD
    const startMin: number | undefined = body?.startMin; // minutos desde medianoche
    const clientIdBody: string | null = typeof body?.clientId === "string" ? body.clientId : null;

    // Obtener solicitud
    const [reqRow] = await db.select().from(appointmentRequests).where(eq(appointmentRequests.id, id));
    if (!reqRow) {
      return NextResponse.json({ ok: false, error: "Solicitud no encontrada" }, { status: 404 });
    }
    const allowedStatuses = ["solicitada", "pendiente"];
    if (!allowedStatuses.includes(String(reqRow.status))) {
      return NextResponse.json({ ok: false, error: "La solicitud ya fue procesada" }, { status: 409 });
    }

    // Validaciones requeridas
    if (!serviceId || !userId) {
      return NextResponse.json({ ok: false, error: "'serviceId' y 'userId' son requeridos" }, { status: 400 });
    }

    // Validar servicio existe
    const [svc] = await db.select().from(services).where(eq(services.id, serviceId));
    if (!svc) {
      return NextResponse.json({ ok: false, error: "Servicio no existe" }, { status: 404 });
    }

    // Validar que el empleado esté asignado al servicio
    const [assign] = await db
      .select()
      .from(serviceAssignees)
      .where(and(eq(serviceAssignees.serviceId, serviceId), eq(serviceAssignees.userId, userId)));
    if (!assign) {
      return NextResponse.json({ ok: false, error: "Empleado no asignado al servicio" }, { status: 400 });
    }

    const useDate = (date ?? (reqRow.desiredDate as unknown as string));
    const useStartMin = (typeof startMin === "number" ? startMin : reqRow.desiredStartMin);

    if (!useDate || typeof useDate !== "string") {
      return NextResponse.json({ ok: false, error: "Fecha inválida (YYYY-MM-DD)" }, { status: 400 });
    }
    if (typeof useStartMin !== "number") {
      return NextResponse.json({ ok: false, error: "'startMin' inválido" }, { status: 400 });
    }
    if (useStartMin % 30 !== 0 || useStartMin < 540 || useStartMin >= 960) {
      return NextResponse.json({ ok: false, error: "startMin debe ser múltiplo de 30 y estar entre 09:00–16:00" }, { status: 400 });
    }

    // Hora de comida del profesional
    const [lb] = await db.select().from(lunchBreaks).where(eq(lunchBreaks.userId, userId));
    if (lb) {
      const lunchStartMin = lb.startMin;
      const lunchEndMin = lunchStartMin + 60;
      if (useStartMin >= lunchStartMin && useStartMin < lunchEndMin) {
        return NextResponse.json({ ok: false, error: "Horario no disponible: hora de comida del profesional" }, { status: 409 });
      }
    }

    // Calcular inicio/fin del slot
    const dayStart = new Date(`${useDate}T00:00:00`);
    const startMs = dayStart.getTime() + useStartMin * 60 * 1000;
    const endMs = startMs + 30 * 60 * 1000;
    const startAt = new Date(startMs);
    const endAt = new Date(endMs);

    // No permitir programar en el pasado
    const now = new Date();
    if (endAt <= now) {
      return NextResponse.json({ ok: false, error: "No se puede programar en el pasado" }, { status: 400 });
    }

    // Evitar doble reserva
    const exists = await db
      .select()
      .from(appointments)
      .where(and(eq(appointments.userId, userId), eq(appointments.startAt, startAt)));
    if (exists.length > 0) {
      return NextResponse.json({ ok: false, error: "Slot ya reservado" }, { status: 409 });
    }

    // Crear cuenta de usuario y perfil si el email no está registrado
    let accountCreated = false;
    let generatedPassword: string | null = null;
    let newClientId: string | null = null;
    let effectiveClientId: string | null = clientIdBody ?? (reqRow.clientId ?? null);

    if (!effectiveClientId && reqRow.clientEmail) {
      try {
        generatedPassword = generatePassword(12);
        const signUpRes: any = await auth.api.signUpEmail({
          body: {
            email: reqRow.clientEmail as string,
            password: generatedPassword,
            name: reqRow.clientName ?? "Cliente",
          },
        });
        const createdUserId: string | undefined = signUpRes?.user?.id ?? signUpRes?.session?.user?.id ?? signUpRes?.data?.user?.id;
        if (createdUserId) {
          // Crear perfil
          const nameParts = (reqRow.clientName ?? "Cliente").trim().split(/\s+/);
          const firstName = nameParts[0] || "Cliente";
          const lastName = nameParts.slice(1).join(" ") || "";
          const phone = (reqRow.clientPhone as string) || "sin-telefono";
          await db.insert(profiles).values({ userId: createdUserId, firstName, lastName, phone, role: "cliente" });
          accountCreated = true;
          newClientId = createdUserId;
          effectiveClientId = createdUserId;
        }
      } catch (e: unknown) {
        // Si ya existe, ignorar y continuar sin crear cuenta
        const msg = e instanceof Error ? e.message : String(e);
        console.warn("No se creó cuenta (posible email ya registrado):", msg);
      }
    }

    // Crear cita
    type NewAppointment = typeof appointments.$inferInsert;
    const payload: NewAppointment = {
      userId,
      clientId: effectiveClientId,
      clientName: reqRow.clientName ?? null,
      clientEmail: reqRow.clientEmail ?? null,
      startAt,
      endAt,
      status: "pendiente",
    };

    const [appt] = await db.insert(appointments).values(payload).returning();

    // Asociar servicio
    await db.insert(appointmentServices).values({ appointmentId: appt.id, serviceId });

    // Marcar solicitud como programada (y enlazar cliente si se creó)
    const [updatedReq] = await db
      .update(appointmentRequests)
      .set({ status: "programada", updatedAt: new Date(), clientId: effectiveClientId })
      .where(eq(appointmentRequests.id, reqRow.id))
      .returning();

    // Enviar email de confirmación al cliente (estilo Apple)
    let emailSent = false;
    try {
      const [advisor] = await db.select().from(profiles).where(eq(profiles.userId, userId));
      const advisorName = advisor ? `${advisor.firstName ?? ""} ${advisor.lastName ?? ""}`.trim() : "Asesor";
      const svcName = svc?.nombre ?? "Servicio";

      const locale = "es-ES";
      const dateStr = startAt.toLocaleDateString(locale, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      const startStr = startAt.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", hour12: false });
      const endStr = endAt.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", hour12: false });

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
      const dashboardUrl = `${appUrl}/dashboard/cliente`;
      const signInUrl = `${appUrl}/sign-in`;

      const subject = "Confirmación de cita — Fideslex";

      const extraAccountHtml = accountCreated && generatedPassword
        ? `
          <div style="border-top:1px solid #eaeaea;margin:16px 0"></div>
          <h2 style="margin:0 0 8px;font-size:18px;font-weight:600">Tu cuenta fue creada</h2>
          <p style="margin:0 0 12px;font-size:14px;color:#555;line-height:1.6;">Hemos creado una cuenta para ti usando tu correo <strong>${reqRow.clientEmail}</strong>.</p>
          <div style="font-size:14px;color:#333;display:flex;flex-direction:column;gap:6px;">
            <div><strong>Usuario:</strong> ${reqRow.clientEmail}</div>
            <div><strong>Contraseña temporal:</strong> ${generatedPassword}</div>
          </div>
          <p style="margin:12px 0;font-size:14px;color:#555;line-height:1.6;">Por seguridad, te recomendamos iniciar sesión y cambiar tu contraseña.</p>
          <a href="${signInUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:8px 14px;border-radius:10px;font-size:14px;">Iniciar sesión</a>
        `
        : "";

      const textExtra = accountCreated && generatedPassword
        ? `\n\nHemos creado una cuenta para ti.\nUsuario: ${reqRow.clientEmail}\nContraseña temporal: ${generatedPassword}\nInicia sesión en ${signInUrl} y cámbiala por seguridad.`
        : "";

      const text = `Hola ${reqRow.clientName},\n\nTu cita para ${svcName} ha sido registrada correctamente.\nFecha: ${dateStr}\nHorario: ${startStr} – ${endStr}\nAsesor: ${advisorName}${textExtra}\n\nSi necesitas reprogramar o cancelar, responde a este correo o visita tu panel.\n\nGracias,\nEquipo Fideslex`;

      const html = `
        <div style="background:#ffffff;padding:32px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#000000;">
          <div style="max-width:600px;margin:0 auto;padding:0 24px;">
            <header style="padding-bottom:16px;">
              <div style="font-weight:600;font-size:20px;letter-spacing:-0.02em;">Fideslex</div>
            </header>
            <main style="background:#fafafa;border:1px solid #eee;border-radius:14px;padding:24px;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;letter-spacing:-0.02em;">Tu cita está confirmada</h1>
              <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.6;">Hola ${reqRow.clientName}, tu cita para <strong>${svcName}</strong> ha sido registrada correctamente.</p>
              <div style="border-top:1px solid #eaeaea;margin:16px 0"></div>
              <div style="display:flex;flex-direction:column;gap:6px;font-size:15px;color:#333;">
                <div><strong>Fecha:</strong> ${dateStr}</div>
                <div><strong>Horario:</strong> ${startStr} – ${endStr}</div>
                <div><strong>Asesor:</strong> ${advisorName}</div>
              </div>
              ${extraAccountHtml}
              <div style="border-top:1px solid #eaeaea;margin:16px 0"></div>
              <p style="margin:0 0 16px;font-size:14px;color:#555;line-height:1.6;">Si necesitas reprogramar o cancelar, puedes hacerlo desde tu panel.</p>
              <a href="${dashboardUrl}" style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:10px 16px;border-radius:10px;font-size:14px;">Ir al panel</a>
            </main>
            <footer style="padding-top:16px;color:#777;font-size:12px;line-height:1.6;">
              <div>Este mensaje se envió a ${reqRow.clientEmail}. No respondas si no esperabas esta confirmación.</div>
            </footer>
          </div>
        </div>
      `;

      if (reqRow.clientEmail) {
        await sendEmail({ to: reqRow.clientEmail as string, subject, text, html });
        emailSent = true;
      }
    } catch (mailErr: unknown) {
      const message = mailErr instanceof Error ? mailErr.message : String(mailErr);
      console.warn("Fallo enviando email de confirmación de cita:", message);
    }

    return NextResponse.json({ ok: true, appointment: appt, request: updatedReq, emailSent, accountCreated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("POST /api/solicitudes-citas/[id]/convertir error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}