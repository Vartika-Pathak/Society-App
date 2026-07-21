import jwt from "jsonwebtoken";
import type { Request } from "express";
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

export function getSessionUserId(req: Request): number | null {
  const token = req.cookies?.[SESSION_COOKIE];
  if (typeof token !== "string") return null;
  return verifySessionToken(token);
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: isProduction,
  maxAge: SESSION_MAX_AGE_MS,
  path: "/",
};
