import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "piazza106_admin_session";
const SESSION_LIFETIME_SECONDS = 60 * 60 * 12; // 12 Stunden

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET ist nicht gesetzt (.env prüfen).");
  }
  return new TextEncoder().encode(secret);
}

export type AdminSessionPayload = {
  sub: string;
  username: string;
};

export async function createAdminSessionToken(payload: AdminSessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_LIFETIME_SECONDS}s`)
    .sign(getSecret());
}

export async function verifyAdminSessionToken(
  token: string,
): Promise<AdminSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.sub === "string" && typeof payload.username === "string") {
      return { sub: payload.sub, username: payload.username };
    }
    return null;
  } catch {
    return null;
  }
}

export const ADMIN_COOKIE_MAX_AGE = SESSION_LIFETIME_SECONDS;

/** Für Server Components & Route Handlers: liest die aktuelle Admin-Session. */
export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminSessionToken(token);
}

/**
 * Für Server Actions: stellt sicher, dass ein Admin eingeloggt ist.
 * Zusätzliche Absicherung zur Middleware (defense in depth) – Server
 * Actions sollten nie blind auf die Middleware vertrauen.
 */
export async function requireAdminSession(): Promise<AdminSessionPayload> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
