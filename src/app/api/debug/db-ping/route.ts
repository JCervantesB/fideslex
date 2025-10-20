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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        ok: false,
        error: message,
        dbUrl: process.env.DATABASE_URL || null,
      },
      { status: 500 },
    );
  }
}