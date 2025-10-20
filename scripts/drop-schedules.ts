import 'dotenv/config';
import { Pool } from 'pg';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    console.log('Dropping table schedules (if exists)...');
    await pool.query('DROP TABLE IF EXISTS schedules CASCADE;');
    console.log('Done.');
  } catch (err) {
    console.error('Error dropping schedules:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();