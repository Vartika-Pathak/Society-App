import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, maintenanceCollectionsTable, flatsTable, buildingsTable, type MaintenanceCollection } from "@workspace/db";
import {
  ListMaintenanceCollectionsResponse,
  CreateMaintenanceCollectionBody,
  CreateMaintenanceCollectionResponse,
} from "@workspace/api-zod";
import { getAuthedUser } from "../lib/auth";

const router: IRouter = Router();

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
