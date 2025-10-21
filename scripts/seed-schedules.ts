import 'dotenv/config';
import { db } from '../src/lib/db';
import { schedules } from '../src/db/schema';
import { Pool } from 'pg';

// Crea la tabla schedules global si no existe
async function ensureSchedulesTable() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schedules (
      id SERIAL PRIMARY KEY,
      start_min INTEGER NOT NULL,
      end_min INTEGER NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS schedules_start_end_unique ON schedules(start_min, end_min);
  `);
  await pool.end();
}

// Genera 48 slots globales de 30 minutos cubriendo 24 horas (00:00 a 24:00)
function generateHalfHourSlots() {
  const slots: Array<{ startMin: number; endMin: number }> = [];
  const startDay = 0; // 00:00
  const endDay = 24 * 60; // 1440 = 24:00
  for (let s = startDay; s + 30 <= endDay; s += 30) {
    slots.push({ startMin: s, endMin: s + 30 });
  }
  return slots;
}

async function main() {
  console.log('Seeding schedules globales: 48 slots de 30min 00:00–24:00');

  await ensureSchedulesTable();

  const baseSlots = generateHalfHourSlots();

  // Evitar duplicados por índice único (start_min, end_min)
  try {
    await db.insert(schedules).values(baseSlots);
    console.log(`Insertados ${baseSlots.length} slots globales.`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('duplicate key')) {
      console.log('Slots ya existentes, no se insertan duplicados.');
    } else {
      throw err;
    }
  }

  console.log('Seed de schedules global completado.');
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error en seed de schedules:', err);
    process.exit(1);
  });