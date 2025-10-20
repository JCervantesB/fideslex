import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles, serviceCategories } from "@/db/schema";
import { and, eq } from "drizzle-orm";

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

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string; categoryId: string }> }) {
  try {
    const authz = await requireAdmin();
    if ("error" in authz) return authz.error;

    const { id, categoryId } = await ctx.params;
    const serviceId = Number(id);
    const catId = Number(categoryId);
    if (Number.isNaN(serviceId) || Number.isNaN(catId)) {
      return NextResponse.json({ ok: false, error: "IDs inválidos" }, { status: 400 });
    }

    await db
      .delete(serviceCategories)
      .where(and(eq(serviceCategories.serviceId, serviceId), eq(serviceCategories.categoryId, catId)));
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("DELETE /api/servicios/[id]/categorias/[categoryId] error:", err?.message || err);
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}