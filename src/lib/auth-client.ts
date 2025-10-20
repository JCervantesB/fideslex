import { createAuthClient } from "better-auth/react";

// Usar el mismo origen del navegador para evitar problemas de cookies entre localhost y 0.0.0.0
const resolvedBaseURL =
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
  process.env.BETTER_AUTH_URL ||
  (typeof window !== "undefined" ? window.location.origin : undefined);

export const authClient = createAuthClient({
  baseURL: resolvedBaseURL,
});

export const { signIn, signOut, signUp, useSession, getSession, forgetPassword, resetPassword } =
  authClient;