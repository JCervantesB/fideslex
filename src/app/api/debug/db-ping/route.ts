import { NextResponse } from "next/server";
import { Pool } from "pg";

export async function GET() {
  try {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    const result = await pool.query("SELECT 1 as ok");

    return NextResponse.json({
      ok: true,
      dbUrlPresent: Boolean(connectionString),
      result: result.rows[0] || null,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || String(err),
        dbUrl: process.env.DATABASE_URL || null,
      },
      { status: 500 },
    );
  }
}