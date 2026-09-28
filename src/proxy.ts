import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { ADMIN_COOKIE_NAME } from "./lib/auth";

// Läuft in der Edge-Runtime -> keine bcrypt/Prisma-Importe hier, nur `jose`
// (Web-Crypto-basiert), um den Session-Cookie zu prüfen.
async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

// Schützt den gesamten Admin-Bereich (Seiten + darüber ausgelöste Server
// Actions). Jede Server Action prüft die Session zusätzlich selbst
// (requireAdminSession) – diese Proxy-Funktion ist die erste Verteidigungslinie
// für Seitenaufrufe.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const authenticated = await isValidSession(token);

  if (pathname === "/admin/login") {
    if (authenticated) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (!authenticated) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
