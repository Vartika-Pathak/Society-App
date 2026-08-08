import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import {
  db,
  maintenanceCollectionsTable,
  maintenanceRatesTable,
  flatsTable,
  buildingsTable,
  type MaintenanceCollection,
} from "@workspace/db";
import {
  ListMaintenanceCollectionsResponse,
  CreateMaintenanceCollectionBody,
  CreateMaintenanceCollectionResponse,
  BackfillMaintenanceCollectionsBody,
  BackfillMaintenanceCollectionsResponse,
} from "@workspace/api-zod";
import { getAuthedUser } from "../lib/auth";

const router: IRouter = Router();

const backfillPaymentModes = ["upi", "bank_transfer", "cash"] as const;

// Months strictly before the current month, oldest first — e.g. count=3 in
// August gives ["2026-05", "2026-06", "2026-07"]. Never touches the current
// month, which the admin is expected to enter live.
function trailingMonthsBeforeCurrent(count: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = count; i >= 1; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

// Deterministic per flat/month, not Math.random() — so a re-run always makes the same flats
// "late" instead of eventually filling every one of them in and defeating the point.
function isSimulatedLate(flatId: number, month: string): boolean {
  const key = `${flatId}:${month}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 10 === 0;
}

function toMaintenanceCollection(row: MaintenanceCollection, buildingName: string, flatNumber: string) {
  return {
    id: row.id,
    flatId: row.flatId,
    buildingName,
    flatNumber,
    payerName: row.payerName,
    amountPaise: row.amountPaise,
    paymentDate: row.paymentDate,
    paymentMode: row.paymentMode,
    forMonth: row.forMonth,
    referenceNumber: row.referenceNumber,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/maintenance-collections", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can view maintenance collections" });
    return;
  }

  const flatId = req.query.flatId ? Number(req.query.flatId) : undefined;
  const forMonth = typeof req.query.forMonth === "string" ? req.query.forMonth : undefined;
  const conditions = [
    flatId !== undefined ? eq(maintenanceCollectionsTable.flatId, flatId) : undefined,
    forMonth !== undefined ? eq(maintenanceCollectionsTable.forMonth, forMonth) : undefined,
  ].filter((c) => c !== undefined);

  const rows = await db
    .select({
      collection: maintenanceCollectionsTable,
      buildingName: buildingsTable.name,
      flatNumber: flatsTable.flatNumber,
    })
    .from(maintenanceCollectionsTable)
    .innerJoin(flatsTable, eq(maintenanceCollectionsTable.flatId, flatsTable.id))
    .innerJoin(buildingsTable, eq(flatsTable.buildingId, buildingsTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  res.status(200).json(
    ListMaintenanceCollectionsResponse.parse(
      rows.map(({ collection, buildingName, flatNumber }) => toMaintenanceCollection(collection, buildingName, flatNumber)),
    ),
  );
});

router.post("/maintenance-collections", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can record maintenance collections" });
    return;
  }

  const parsed = CreateMaintenanceCollectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [flat] = await db.select().from(flatsTable).where(eq(flatsTable.id, parsed.data.flatId));
  if (!flat) {
    res.status(404).json({ error: "Unknown flat" });
    return;
  }
  const [building] = await db.select().from(buildingsTable).where(eq(buildingsTable.id, flat.buildingId));

  const [created] = await db.insert(maintenanceCollectionsTable).values(parsed.data).returning();
  res
    .status(201)
    .json(CreateMaintenanceCollectionResponse.parse(toMaintenanceCollection(created, building.name, flat.flatNumber)));
});

// One-time (but safely re-runnable) historical seed for months before the current one — mostly
// full on-time payments per flat's rate, with a small fraction of flat/month pairs left unpaid
// each month to look realistic. Never touches a flat/month pair that already has a collection.
router.post("/maintenance-collections/backfill", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can backfill maintenance collections" });
    return;
  }

  const parsed = BackfillMaintenanceCollectionsBody.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const months = trailingMonthsBeforeCurrent(parsed.data.months ?? 3);

  const flats = await db.select().from(flatsTable);
  const rates = await db.select().from(maintenanceRatesTable);
  const rateByFlatType = new Map(rates.map((rate) => [rate.flatType, rate.monthlyAmountPaise]));

  const existing = await db
    .select({ flatId: maintenanceCollectionsTable.flatId, forMonth: maintenanceCollectionsTable.forMonth })
    .from(maintenanceCollectionsTable);
  const existingKeys = new Set(existing.map((row) => `${row.flatId}:${row.forMonth}`));

  let createdCount = 0;
  let skippedCount = 0;

  for (const month of months) {
    for (const flat of flats) {
      if (existingKeys.has(`${flat.id}:${month}`)) {
        skippedCount++;
        continue;
      }
      const amountPaise = rateByFlatType.get(flat.flatType) ?? 0;
      const isLate = amountPaise <= 0 || isSimulatedLate(flat.id, month);
      if (isLate) {
        skippedCount++;
        continue;
      }

      await db.insert(maintenanceCollectionsTable).values({
        flatId: flat.id,
        payerName: `Flat ${flat.flatNumber} Resident`,
        amountPaise,
        paymentDate: `${month}-05`,
        paymentMode: backfillPaymentModes[flat.id % backfillPaymentModes.length],
        forMonth: month,
        notes: "Backfilled historical record",
      });
      createdCount++;
    }
  }

  res
    .status(200)
    .json(BackfillMaintenanceCollectionsResponse.parse({ monthsBackfilled: months, createdCount, skippedCount }));
});

router.delete("/maintenance-collections/:id", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can delete maintenance collections" });
    return;
  }

  const id = Number(req.params.id);
  const [deleted] = await db.delete(maintenanceCollectionsTable).where(eq(maintenanceCollectionsTable.id, id)).returning();

  if (!deleted) {
    res.status(404).json({ error: "Maintenance collection not found" });
    return;
  }

  res.status(204).send();
});

export default router;
