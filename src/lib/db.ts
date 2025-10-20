import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("DATABASE_URL no está definido. Drizzle no podrá conectarse hasta que se configure.");
}

// Solo habilita SSL si realmente se requiere por configuración
const requireSSL =
  (connectionString ?? "").includes("sslmode=require") ||
  ["require", "verify-ca", "verify-full"].includes((process.env.PGSSLMODE ?? "").toLowerCase()) ||
  (process.env.DB_SSL ?? "").toLowerCase() === "true";

const pool = new Pool({
  connectionString,
  ssl: requireSSL ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(pool);