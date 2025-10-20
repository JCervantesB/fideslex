import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles, categories } from "@/db/schema";
import { eq } from "drizzle-orm";

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

export async function GET() {
  try {
    const authz = await requireAdmin();
    if ("error" in authz) return authz.error;

    const rows = await db.select().from(categories);
    return NextResponse.json({ ok: true, items: rows });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("GET /api/categorias error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authz = await requireAdmin();
    if ("error" in authz) return authz.error;

    const body = await req.json();
    const nombre: string | undefined = body?.nombre;
    const descripcion: string | null = body?.descripcion ?? null;
    if (!nombre || nombre.trim().length === 0) {
      return NextResponse.json({ ok: false, error: "'nombre' es requerido" }, { status: 400 });
    }

    const inserted = await db
      .insert(categories)
      .values({ nombre: nombre.trim(), descripcion })
      .returning({ id: categories.id });

    return NextResponse.json({ ok: true, item: inserted[0] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("POST /api/categorias error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}