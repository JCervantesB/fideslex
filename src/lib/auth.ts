import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { sendEmail } from "@/lib/email";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Normaliza baseURL evitando valores locales en producción
const envBase = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;
const isLocal = (url?: string) => (url ? /localhost|127\.0\.0\.1/i.test(url) : false);
const computedBaseURL =
  process.env.NODE_ENV === "production"
    ? isLocal(envBase)
      ? "https://fideslex.site"
      : envBase ?? "https://fideslex.site"
    : envBase ?? "http://localhost:3000";

export const auth = betterAuth({
  database: pool,
  baseURL: computedBaseURL,
  secret: process.env.BETTER_AUTH_SECRET!,
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 días
    },
  },
  cookies: {
    sessionToken: {
      name: "better-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        // Asegura que el cookie sea válido para www y raíz en producción
        domain: process.env.NODE_ENV === "production" ? ".fideslex.site" : undefined,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    // Enviar correo de restablecimiento de contraseña usando SMTP (.env)
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Restablecer contraseña",
        text: `Para restablecer tu contraseña, visita: ${url}`,
      });
    },
  },
});