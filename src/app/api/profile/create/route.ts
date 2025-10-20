import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { profiles } from "@/db/schema";
import { Pool } from "pg";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, firstName, lastName, phone, role = "cliente" } = body || {};

    if (!userId || !firstName || !lastName || !phone) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    // Asegurar que la tabla profiles exista (entorno dev sin migraciones)
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await pool.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        user_id TEXT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'cliente',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await db.insert(profiles).values({ userId, firstName, lastName, phone, role });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Error creando perfil:", err?.message || err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}