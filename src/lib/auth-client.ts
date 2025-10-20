"use client";
import { createAuthClient } from "better-auth/react";

export const { signIn, signUp, signOut, useSession } = createAuthClient({
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "https://fideslex.site",
});