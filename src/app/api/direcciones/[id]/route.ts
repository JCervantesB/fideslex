import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { addresses, profiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";

async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!profile) {
    return { error: NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 }) };
  }
  return { session, profile };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authz = await requireAuth();
    if ("error" in authz) return authz.error;

    const id = parseInt((await params).id);
    if (isNaN(id)) {
      return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
    }

    const [address] = await db
      .select()
      .from(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, authz.session.user.id)));

    if (!address) {
      return NextResponse.json({ ok: false, error: "Dirección no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, item: address });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("GET /api/direcciones/[id] error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authz = await requireAuth();
    if ("error" in authz) return authz.error;

    const id = parseInt((await params).id);
    if (isNaN(id)) {
      return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
    }

    const body = await req.json();
    const nombre: string | undefined = body?.nombre;
    const direccion: string | undefined = body?.direccion;
    
    if (!nombre || nombre.trim().length === 0) {
      return NextResponse.json({ ok: false, error: "'nombre' es requerido" }, { status: 400 });
    }
    
    if (!direccion || direccion.trim().length === 0) {
      return NextResponse.json({ ok: false, error: "'direccion' es requerida" }, { status: 400 });
    }

    // Verificar que la dirección pertenece al usuario
    const [existingAddress] = await db
      .select()
      .from(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, authz.session.user.id)));

    if (!existingAddress) {
      return NextResponse.json({ ok: false, error: "Dirección no encontrada" }, { status: 404 });
    }

    await db
      .update(addresses)
      .set({ 
        nombre: nombre.trim(), 
        direccion: direccion.trim(),
        updatedAt: new Date()
      })
      .where(and(eq(addresses.id, id), eq(addresses.userId, authz.session.user.id)));

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("PUT /api/direcciones/[id] error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authz = await requireAuth();
    if ("error" in authz) return authz.error;

    const id = parseInt((await params).id);
    if (isNaN(id)) {
      return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
    }

    // Verificar que la dirección pertenece al usuario
    const [existingAddress] = await db
      .select()
      .from(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, authz.session.user.id)));

    if (!existingAddress) {
      return NextResponse.json({ ok: false, error: "Dirección no encontrada" }, { status: 404 });
    }

    await db
      .delete(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, authz.session.user.id)));

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("DELETE /api/direcciones/[id] error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}