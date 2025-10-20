import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles, categories, serviceCategories } from "@/db/schema";
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

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const authz = await requireAdmin();
    if ("error" in authz) return authz.error;

    const { id } = await ctx.params;
    const serviceId = Number(id);
    if (Number.isNaN(serviceId)) {
      return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
    }

    const rows = await db
      .select({
        id: categories.id,
        nombre: categories.nombre,
        descripcion: categories.descripcion,
      })
      .from(serviceCategories)
      .innerJoin(categories, eq(serviceCategories.categoryId, categories.id))
      .where(eq(serviceCategories.serviceId, serviceId));

    return NextResponse.json({ ok: true, items: rows });
  } catch (err: any) {
    console.error("GET /api/servicios/[id]/categorias error:", err?.message || err);
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const authz = await requireAdmin();
    if ("error" in authz) return authz.error;

    const { id } = await ctx.params;
    const serviceId = Number(id);
    if (Number.isNaN(serviceId)) {
      return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
    }
    const body = await req.json();
    const categoryId: number | undefined = body?.categoryId;
    if (!categoryId || Number.isNaN(Number(categoryId))) {
      return NextResponse.json({ ok: false, error: "'categoryId' es requerido" }, { status: 400 });
    }

    const [cat] = await db.select().from(categories).where(eq(categories.id, Number(categoryId)));
    if (!cat) {
      return NextResponse.json({ ok: false, error: "Categoría no existe" }, { status: 404 });
    }

    await db
      .insert(serviceCategories)
      .values({ serviceId: serviceId, categoryId: Number(categoryId) })
      .onConflictDoNothing();

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("POST /api/servicios/[id]/categorias error:", err?.message || err);
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}