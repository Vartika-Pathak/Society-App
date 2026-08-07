import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, maintenanceDiscountsTable, type MaintenanceDiscount } from "@workspace/db";
import {
  ListMaintenanceDiscountsResponse,
  CreateMaintenanceDiscountBody,
  CreateMaintenanceDiscountResponse,
  UpdateMaintenanceDiscountBody,
  UpdateMaintenanceDiscountResponse,
} from "@workspace/api-zod";
import { getAuthedUser } from "../lib/auth";

const router: IRouter = Router();

function toDiscount(row: MaintenanceDiscount) {
  return {
    id: row.id,
    name: row.name,
    discountType: row.discountType,
    value: row.value,
    description: row.description,
    active: row.active,
  };
}

router.get("/maintenance-discounts", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can view maintenance discounts" });
    return;
  }

  const rows = await db.select().from(maintenanceDiscountsTable);
  res.status(200).json(ListMaintenanceDiscountsResponse.parse(rows.map(toDiscount)));
});

router.post("/maintenance-discounts", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can add maintenance discounts" });
    return;
  }

  const parsed = CreateMaintenanceDiscountBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [created] = await db.insert(maintenanceDiscountsTable).values(parsed.data).returning();
  res.status(201).json(CreateMaintenanceDiscountResponse.parse(toDiscount(created)));
});

router.put("/maintenance-discounts/:id", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can update maintenance discounts" });
    return;
  }

  const id = Number(req.params.id);
  const parsed = UpdateMaintenanceDiscountBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(maintenanceDiscountsTable)
    .set(parsed.data)
    .where(eq(maintenanceDiscountsTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Maintenance discount not found" });
    return;
  }

  res.status(200).json(UpdateMaintenanceDiscountResponse.parse(toDiscount(updated)));
});

router.delete("/maintenance-discounts/:id", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can delete maintenance discounts" });
    return;
  }

  const id = Number(req.params.id);
  const [deleted] = await db.delete(maintenanceDiscountsTable).where(eq(maintenanceDiscountsTable.id, id)).returning();

  if (!deleted) {
    res.status(404).json({ error: "Maintenance discount not found" });
    return;
  }

  res.status(204).send();
});

export default router;
