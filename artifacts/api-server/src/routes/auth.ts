import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable, type User } from "@workspace/db";
import { SignupBody, SignupResponse, LoginBody, LoginResponse, GetCurrentUserResponse } from "@workspace/api-zod";
import { SESSION_COOKIE, sessionCookieOptions, signSessionToken, getSessionUserId } from "../lib/auth";

const router: IRouter = Router();

const PASSWORD_HASH_ROUNDS = 10;

function toAuthUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    flatNumber: user.flatNumber,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}

router.post("/auth/signup", async (req, res): Promise<void> => {
  const parsed = SignupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, email, flatNumber, password } = parsed.data;

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, PASSWORD_HASH_ROUNDS);
  const [user] = await db
    .insert(usersTable)
    .values({ name, email, flatNumber, passwordHash })
    .returning();

  res.cookie(SESSION_COOKIE, signSessionToken(user.id), sessionCookieOptions);
  res.status(201).json(SignupResponse.parse(toAuthUser(user)));
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  res.cookie(SESSION_COOKIE, signSessionToken(user.id), sessionCookieOptions);
  res.status(200).json(LoginResponse.parse(toAuthUser(user)));
});

router.post("/auth/logout", (_req, res): void => {
  res.clearCookie(SESSION_COOKIE, { ...sessionCookieOptions, maxAge: undefined });
  res.status(204).send();
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = getSessionUserId(req);
  if (userId === null) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }

  res.status(200).json(GetCurrentUserResponse.parse(toAuthUser(user)));
});

export default router;
