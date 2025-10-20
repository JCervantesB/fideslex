import { betterAuth } from "better-auth";
import { Pool } from "pg";

const useSSL = process.env.NODE_ENV === "production";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // En muchos proveedores gestionados (Neon, Railway, Supabase) producción requiere SSL
  ssl: useSSL ? { rejectUnauthorized: false } : undefined,
});

export const auth = betterAuth({
  database: pool,
  baseURL: process.env.BETTER_AUTH_URL!,
  secret: process.env.BETTER_AUTH_SECRET!,
  emailAndPassword: {
    enabled: true,
  },
});