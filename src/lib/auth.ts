import { betterAuth } from "better-auth";
import { Pool } from "pg";

// Solo habilita SSL si realmente se requiere por configuración
const requireSSL =
  (process.env.DATABASE_URL ?? "").includes("sslmode=require") ||
  ["require", "verify-ca", "verify-full"].includes((process.env.PGSSLMODE ?? "").toLowerCase()) ||
  (process.env.DB_SSL ?? "").toLowerCase() === "true";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: requireSSL ? { rejectUnauthorized: false } : undefined,
});

export const auth = betterAuth({
  database: pool,
  baseURL: process.env.BETTER_AUTH_URL!,
  secret: process.env.BETTER_AUTH_SECRET!,
  emailAndPassword: {
    enabled: true,
  },
});