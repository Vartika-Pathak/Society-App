import jwt from "jsonwebtoken";
import type { Request } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, type User, type UserRole } from "@workspace/db";
import { logger } from "./logger";

const isProduction = process.env.NODE_ENV === "production";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-only-insecure-secret-change-me";
if (!process.env.JWT_SECRET) {
  logger.warn(
    "JWT_SECRET is not set — using an insecure development default. Set JWT_SECRET before deploying anywhere real.",
  );
}

export const SESSION_COOKIE = "session";
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function signSessionToken(userId: number): string {
  return jwt.sign({ sub: String(userId) }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifySessionToken(token: string): number | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (typeof payload === "object" && typeof payload.sub === "string") {
      const userId = Number(payload.sub);
      return Number.isFinite(userId) ? userId : null;
    }
    return null;
  } catch {
    return null;
  }
}

interface SessionClaims {
  sub: string;
  name?: unknown;
  email?: unknown;
  flatNumber?: unknown;
  role?: unknown;
}

function decodeSessionClaims(token: string): SessionClaims | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (typeof payload === "object" && typeof payload.sub === "string") {
      return payload as SessionClaims;
    }
    return null;
  } catch {
    return null;
  }
}

export function getSessionUserId(req: Request): number | null {
  const token = req.cookies?.[SESSION_COOKIE];
  if (typeof token !== "string") return null;
  return verifySessionToken(token);
}

/**
 * The real accounts residents/guards/admins log in with live in the separate Java backend's
 * MySQL database, not this server's own `usersTable` — the two share only a JWT secret and the
 * "session" cookie name. Java embeds name/email/flatNumber/role directly in the token it signs,
 * so a token carrying those claims is trusted as-is instead of being looked up locally (there's
 * usually no matching row here to find). A token without those claims came from this server's
 * own (legacy, dev-only) /auth/login — that path still falls back to the local table.
 */
export async function getAuthedUser(req: Request): Promise<User | null> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (typeof token !== "string") return null;

  const claims = decodeSessionClaims(token);
  if (!claims) return null;

  const userId = Number(claims.sub);
  if (!Number.isFinite(userId)) return null;

  if (
    typeof claims.name === "string" &&
    typeof claims.email === "string" &&
    typeof claims.flatNumber === "string" &&
    typeof claims.role === "string"
  ) {
    return {
      id: userId,
      name: claims.name,
      email: claims.email,
      flatNumber: claims.flatNumber,
      role: claims.role as UserRole,
      // Neither field is carried in the token or read by any authenticated route — the real
      // values live in the Java backend's own record for this user. passwordHash is never a
      // real hash here, so it can't be mistaken for one; nothing checks a password against it.
      passwordHash: "",
      createdAt: new Date(0),
    };
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  return user ?? null;
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: isProduction,
  maxAge: SESSION_MAX_AGE_MS,
  path: "/",
};
