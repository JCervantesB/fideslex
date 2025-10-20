import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles } from "@/db/schema";
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

export async function GET(req: Request) {
  try {
    const authz = await requireAdmin();
    if ("error" in authz) return authz.error;

    const url = new URL(req.url);
    const role = url.searchParams.get("role");

    let rows;
    if (role) {
      rows = await db.select().from(profiles).where(eq(profiles.role, role));
    } else {
      rows = await db.select().from(profiles);
    }

    return NextResponse.json({ ok: true, items: rows });
  } catch (err: any) {
    console.error("GET /api/usuarios error:", err?.message || err);
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}