import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("DATABASE_URL no está definido. Drizzle no podrá conectarse hasta que se configure.");
}

const pool = new Pool({
  connectionString,
});

export const db = drizzle(pool);