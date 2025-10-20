import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { sendEmail } from "@/lib/email";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const auth = betterAuth({
  database: pool,
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
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