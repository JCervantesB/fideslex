import 'dotenv/config';
import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL no está definido en variables de entorno.');
    process.exit(1);
  }

  const client = new Client({ connectionString });
  await client.connect();

  const db = drizzle(client);

  try {
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log('Migraciones aplicadas correctamente.');
  } catch (err) {
    console.error('Error aplicando migraciones:', err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Fallo en migración:', err);
  process.exit(1);
});