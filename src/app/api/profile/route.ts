import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }

    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
    if (!profile) {
      return NextResponse.json({ ok: false, error: "Perfil no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, item: profile });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("GET /api/profile error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}