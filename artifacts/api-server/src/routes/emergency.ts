import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, emergencyAlertsTable, type EmergencyAlert } from "@workspace/db";
import {
  RaiseEmergencyAlertResponse,
  GetMyEmergencyAlertResponse,
  ListActiveEmergencyAlertsResponse,
  ResolveEmergencyAlertParams,
  ResolveEmergencyAlertResponse,
} from "@workspace/api-zod";
import { getAuthedUser } from "../lib/auth";

const router: IRouter = Router();

function toAlert(alert: EmergencyAlert) {
  return {
    id: alert.id,
    status: alert.status,
    residentName: alert.residentName,
    residentFlatNumber: alert.residentFlatNumber,
    createdAt: alert.createdAt.toISOString(),
    resolvedAt: alert.resolvedAt?.toISOString() ?? null,
  };
}

router.post("/emergency-alerts", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }

  const [existing] = await db
    .select()
    .from(emergencyAlertsTable)
    .where(and(eq(emergencyAlertsTable.residentId, user.id), eq(emergencyAlertsTable.status, "active")));

  if (existing) {
    res.status(201).json(RaiseEmergencyAlertResponse.parse(toAlert(existing)));
    return;
  }

  const [alert] = await db
    .insert(emergencyAlertsTable)
    .values({ residentId: user.id, residentName: user.name, residentFlatNumber: user.flatNumber })
    .returning();

  res.status(201).json(RaiseEmergencyAlertResponse.parse(toAlert(alert)));
});

router.get("/emergency-alerts/mine", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }

  const [alert] = await db
    .select()
    .from(emergencyAlertsTable)
    .where(and(eq(emergencyAlertsTable.residentId, user.id), eq(emergencyAlertsTable.status, "active")));

  if (!alert) {
    res.status(204).send();
    return;
  }

  res.status(200).json(GetMyEmergencyAlertResponse.parse(toAlert(alert)));
});

router.get("/emergency-alerts/active", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }

  const rows = await db
    .select()
    .from(emergencyAlertsTable)
    .where(eq(emergencyAlertsTable.status, "active"))
    .orderBy(desc(emergencyAlertsTable.createdAt));

  res.status(200).json(ListActiveEmergencyAlertsResponse.parse(rows.map(toAlert)));
});

router.post("/emergency-alerts/:id/resolve", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }

  const params = ResolveEmergencyAlertParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(emergencyAlertsTable)
    .where(eq(emergencyAlertsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }

  const isReportingResident = existing.residentId === user.id;
  const isStaff = user.role === "guard" || user.role === "admin";
  if (!isReportingResident && !isStaff) {
    res.status(403).json({ error: "Only the reporting resident, a guard, or an admin can resolve this alert" });
    return;
  }

  const [updated] = await db
    .update(emergencyAlertsTable)
    .set({ status: "resolved", resolvedBy: user.id, resolvedAt: new Date() })
    .where(eq(emergencyAlertsTable.id, params.data.id))
    .returning();

  res.status(200).json(ResolveEmergencyAlertResponse.parse(toAlert(updated)));
});

export default router;
