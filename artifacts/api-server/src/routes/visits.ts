import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, visitsTable, usersTable, type Visit } from "@workspace/db";
import {
  CreateVisitBody,
  CreateVisitResponse,
  ListMyVisitsResponse,
  LookupVisitBody,
  LookupVisitResponse,
  DecideVisitParams,
  DecideVisitBody,
  DecideVisitResponse,
} from "@workspace/api-zod";
import { getAuthedUser } from "../lib/auth";

const router: IRouter = Router();

const OTP_VALID_MS = 4 * 60 * 60 * 1000; // 4 hours

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function toVisit(visit: Visit) {
  return {
    id: visit.id,
    visitType: visit.visitType,
    visitorName: visit.visitorName,
    visitorPhone: visit.visitorPhone,
    otpCode: visit.otpCode,
    status: visit.status,
    expiresAt: visit.expiresAt.toISOString(),
    createdAt: visit.createdAt.toISOString(),
  };
}

router.post("/visits", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }

  const parsed = CreateVisitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [visit] = await db
    .insert(visitsTable)
    .values({
      residentId: user.id,
      visitType: parsed.data.visitType,
      visitorName: parsed.data.visitorName,
      visitorPhone: parsed.data.visitorPhone,
      otpCode: generateOtp(),
      expiresAt: new Date(Date.now() + OTP_VALID_MS),
    })
    .returning();

  res.status(201).json(CreateVisitResponse.parse(toVisit(visit)));
});

router.get("/visits/mine", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }

  const visits = await db
    .select()
    .from(visitsTable)
    .where(eq(visitsTable.residentId, user.id))
    .orderBy(desc(visitsTable.createdAt));

  res.status(200).json(ListMyVisitsResponse.parse(visits.map(toVisit)));
});

router.post("/visits/lookup", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "guard" && user.role !== "admin") {
    res.status(403).json({ error: "Only guards and admins can look up visits" });
    return;
  }

  const parsed = LookupVisitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .select({ visit: visitsTable, resident: usersTable })
    .from(visitsTable)
    .innerJoin(usersTable, eq(visitsTable.residentId, usersTable.id))
    .where(and(eq(visitsTable.otpCode, parsed.data.otpCode), eq(visitsTable.status, "pending")));

  if (!row || row.visit.expiresAt.getTime() < Date.now()) {
    res.status(404).json({ error: "No matching pending visitor entry for that code" });
    return;
  }

  res.status(200).json(
    LookupVisitResponse.parse({
      ...toVisit(row.visit),
      residentName: row.resident.name,
      residentFlatNumber: row.resident.flatNumber,
    }),
  );
});

router.post("/visits/:id/decide", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "guard" && user.role !== "admin") {
    res.status(403).json({ error: "Only guards and admins can decide on visits" });
    return;
  }

  const params = DecideVisitParams.safeParse(req.params);
  const body = DecideVisitBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: (params.error ?? body.error)?.message });
    return;
  }

  const [existing] = await db.select().from(visitsTable).where(eq(visitsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Visit not found" });
    return;
  }

  const [updated] = await db
    .update(visitsTable)
    .set({
      status: body.data.approve ? "approved" : "denied",
      approvedBy: user.id,
      respondedAt: new Date(),
    })
    .where(eq(visitsTable.id, params.data.id))
    .returning();

  res.status(200).json(DecideVisitResponse.parse(toVisit(updated)));
});

export default router;
