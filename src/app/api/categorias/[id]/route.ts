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

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const authz = await requireAdmin();
    if ("error" in authz) return authz.error;

    const { id } = await ctx.params;
    const categoryId = Number(id);
    if (Number.isNaN(categoryId)) {
      return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
    }

    const body = await req.json();
    type CategoryUpdate = Partial<typeof categories.$inferInsert>;
    const data: CategoryUpdate = {};
    if (body.nombre !== undefined) data.nombre = String(body.nombre);
    if (body.descripcion !== undefined) data.descripcion = body.descripcion === null ? null : String(body.descripcion);

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ ok: false, error: "Sin cambios" }, { status: 400 });
    }

    const [updated] = await db.update(categories).set(data).where(eq(categories.id, categoryId)).returning();
    if (!updated) {
      return NextResponse.json({ ok: false, error: "No encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, item: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("PUT /api/categorias/[id] error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const authz = await requireAdmin();
    if ("error" in authz) return authz.error;

    const { id } = await ctx.params;
    const categoryId = Number(id);
    if (Number.isNaN(categoryId)) {
      return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
    }

    const [deleted] = await db.delete(categories).where(eq(categories.id, categoryId)).returning();
    if (!deleted) {
      return NextResponse.json({ ok: false, error: "No encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("DELETE /api/categorias/[id] error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}