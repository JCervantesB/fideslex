"use client";
import { createAuthClient } from "better-auth/react";

export const { signIn, signUp, signOut, useSession } = createAuthClient({
  // En cliente, usamos siempre el mismo origen del navegador
  baseURL: window.location.origin,
});