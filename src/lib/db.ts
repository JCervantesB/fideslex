import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("DATABASE_URL no está definido. Drizzle no podrá conectarse hasta que se configure.");
}

const useSSL = process.env.NODE_ENV === "production";

const pool = new Pool({
  connectionString,
  // Activa SSL en producción para proveedores gestionados
  ssl: useSSL ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(pool);