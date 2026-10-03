// Session token signing — edge-safe (used by proxy.ts and server code).
import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "ptp_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

let derived: Promise<Uint8Array> | null = null;

/**
 * AUTH_SECRET when set. Otherwise a key derived from DATABASE_URL, which is
 * already a server-only secret (anyone holding it has the database anyway), so a
 * fresh Vercel + Neon deploy works without anyone pasting a secret by hand.
 */
async function secret(): Promise<Uint8Array> {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 32) return new TextEncoder().encode(s);
  const db = process.env.DATABASE_URL;
  if (!db) throw new Error("Set AUTH_SECRET (32+ characters) or DATABASE_URL");
  derived ??= crypto.subtle
    .digest("SHA-256", new TextEncoder().encode(`prime-team-planner/session/v1|${db}`))
    .then((buf) => new Uint8Array(buf));
  return derived;
}

/** `sid` identifies this login; only the account's latest sid is honoured (one login at a time). */
export async function signSession(memberId: string, sid: string): Promise<string> {
  return new SignJWT({ sid })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(memberId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(await secret());
}

export async function verifySession(token: string | undefined): Promise<{ memberId: string; sid: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, await secret(), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || typeof payload.sid !== "string") return null;
    return { memberId: payload.sub, sid: payload.sid };
  } catch {
    return null;
  }
}
