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

export async function PUT(req: Request, ctx: any) {
  try {
    const authz = await requireAdmin();
    if ("error" in authz) return authz.error;

    const { userId } = await ctx.params;
    if (!userId) {
      return NextResponse.json({ ok: false, error: "userId requerido" }, { status: 400 });
    }
    const body = await req.json();
    const { role: roleRaw, firstName: firstNameRaw, lastName: lastNameRaw, phone: phoneRaw } = body || {};
    const update: Partial<{ role: string; firstName: string; lastName: string; phone: string }> = {};
    
    const role = typeof roleRaw === "string" ? roleRaw.trim() : "";
    if (role) {
      if (role !== "cliente" && role !== "usuario" && role !== "administrador") {
        return NextResponse.json({ ok: false, error: "Rol inválido" }, { status: 400 });
      }
      update.role = role;
    }
    
    const firstName = typeof firstNameRaw === "string" ? firstNameRaw.trim() : "";
    if (firstName) {
      if (firstName.length > 100) {
        return NextResponse.json({ ok: false, error: "Nombre demasiado largo" }, { status: 400 });
      }
      update.firstName = firstName;
    }
    
    const lastName = typeof lastNameRaw === "string" ? lastNameRaw.trim() : "";
    if (lastName) {
      if (lastName.length > 100) {
        return NextResponse.json({ ok: false, error: "Apellido demasiado largo" }, { status: 400 });
      }
      update.lastName = lastName;
    }
    
    const phone = typeof phoneRaw === "string" ? phoneRaw.trim() : "";
    if (phone) {
      if (phone.length > 20) {
        return NextResponse.json({ ok: false, error: "Teléfono demasiado largo" }, { status: 400 });
      }
      update.phone = phone;
    }
    
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ ok: false, error: "Sin campos para actualizar" }, { status: 400 });
    }
    
    await db.update(profiles).set(update).where(eq(profiles.userId, userId));
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("PUT /api/usuarios/[userId] error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}