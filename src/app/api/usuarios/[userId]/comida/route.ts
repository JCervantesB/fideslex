import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles, lunchBreaks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Pool } from "pg";

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

export async function GET(_req: Request, ctx: { params: Promise<{ userId: string }> }) {
  try {
    const authz = await requireAdmin();
    if ("error" in authz) return authz.error;

    await ensureLunchBreaksTable();

    const { userId } = await ctx.params;
    if (!userId) return NextResponse.json({ ok: false, error: "userId requerido" }, { status: 400 });

    const [item] = await db.select().from(lunchBreaks).where(eq(lunchBreaks.userId, userId));
    return NextResponse.json({ ok: true, item: item || null });
  } catch (err: any) {
    console.error("GET /api/usuarios/[userId]/comida error:", err?.message || err);
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}

export async function PUT(req: Request, ctx: { params: Promise<{ userId: string }> }) {
  try {
    const authz = await requireAdmin();
    if ("error" in authz) return authz.error;

    await ensureLunchBreaksTable();

    const { userId } = await ctx.params;
    if (!userId) return NextResponse.json({ ok: false, error: "userId requerido" }, { status: 400 });

    const body = await req.json();
    const { startMin } = body || {};

    if (typeof startMin !== "number") {
      return NextResponse.json({ ok: false, error: "startMin (minutos) requerido" }, { status: 400 });
    }
    if (startMin % 30 !== 0) {
      return NextResponse.json({ ok: false, error: "startMin debe ser múltiplo de 30" }, { status: 400 });
    }
    if (startMin < 540 || startMin > 900) {
      return NextResponse.json({ ok: false, error: "Horario inválido: solo 09:00–15:00 para 1h de comida" }, { status: 400 });
    }

    const [target] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    if (!target) return NextResponse.json({ ok: false, error: "Perfil destino no encontrado" }, { status: 404 });
    if (target.role !== "usuario" && target.role !== "administrador") {
      return NextResponse.json({ ok: false, error: "Solo roles usuario/administrador pueden tener hora de comida" }, { status: 400 });
    }

    const [existing] = await db.select().from(lunchBreaks).where(eq(lunchBreaks.userId, userId));
    if (existing) {
      const [row] = await db
        .update(lunchBreaks)
        .set({ startMin })
        .where(eq(lunchBreaks.userId, userId))
        .returning();
      return NextResponse.json({ ok: true, item: row });
    } else {
      const [row] = await db.insert(lunchBreaks).values({ userId, startMin }).returning();
      return NextResponse.json({ ok: true, item: row });
    }
  } catch (err: any) {
    console.error("PUT /api/usuarios/[userId]/comida error:", err?.message || err);
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ userId: string }> }) {
  try {
    const authz = await requireAdmin();
    if ("error" in authz) return authz.error;

    await ensureLunchBreaksTable();

    const { userId } = await ctx.params;
    if (!userId) return NextResponse.json({ ok: false, error: "userId requerido" }, { status: 400 });

    await db.delete(lunchBreaks).where(eq(lunchBreaks.userId, userId));
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("DELETE /api/usuarios/[userId]/comida error:", err?.message || err);
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}