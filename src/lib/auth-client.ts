"use client";
import { createAuthClient } from "better-auth/react";

export const { signIn, signUp, signOut, useSession } = createAuthClient({
  // baseURL opcional si frontend y API comparten dominio
});