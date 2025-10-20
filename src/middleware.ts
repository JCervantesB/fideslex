import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isDashboardRoute = pathname.startsWith("/dashboard");

  if (!isDashboardRoute) {
    return NextResponse.next();
  }

  // Detectar cookies de sesión de Better Auth considerando el prefijo __Secure- en producción
  const securePrefix = process.env.NODE_ENV === "production" ? "__Secure-" : "";
  const possibleNames = [
    `${securePrefix}better-auth.session_token`,
    "better-auth.session_token",
  ];
  const hasSessionCookie = possibleNames.some((name) => Boolean(request.cookies.get(name)));

  if (!hasSessionCookie) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};