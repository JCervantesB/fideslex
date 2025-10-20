"use client";
import { createAuthClient } from "better-auth/react";

// Según la guía, si el auth server está en el mismo dominio,
// no es necesario pasar baseURL.
export const { signIn, signUp, signOut, useSession } = createAuthClient();