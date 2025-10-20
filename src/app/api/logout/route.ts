import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function POST() {
  try {
    // Obtener la sesión actual
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (session?.session) {
      // Invalidar la sesión en el servidor
      await auth.api.signOut({ headers: await headers() });
    }
    
    // Crear respuesta con cookies limpiadas
    const response = NextResponse.json({ ok: true, message: "Sesión cerrada correctamente" });

    const securePrefix = process.env.NODE_ENV === "production" ? "__Secure-" : "";
    const names = [
      `${securePrefix}better-auth.session_token`,
      `${securePrefix}better-auth.csrf_token`,
      "better-auth.session_token",
      "better-auth.csrf_token",
    ];
    for (const name of names) {
      response.cookies.set(name, "", {
        expires: new Date(0),
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }
    
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("POST /api/logout error:", message);
    
    // Incluso si hay error, limpiar cookies
    const response = NextResponse.json({ ok: false, error: message }, { status: 500 });
    const securePrefix = process.env.NODE_ENV === "production" ? "__Secure-" : "";
    const names = [
      `${securePrefix}better-auth.session_token`,
      `${securePrefix}better-auth.csrf_token`,
      "better-auth.session_token",
      "better-auth.csrf_token",
    ];
    for (const name of names) {
      response.cookies.set(name, "", {
        expires: new Date(0),
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }
    
    return response;
  }
}