import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, maintenanceRatesTable, flatTypes, type MaintenanceRate, type FlatType } from "@workspace/db";
import { ListMaintenanceRatesResponse, UpdateMaintenanceRateBody, UpdateMaintenanceRateResponse } from "@workspace/api-zod";
import { getAuthedUser } from "../lib/auth";

const router: IRouter = Router();

function toMaintenanceRate(row: MaintenanceRate) {
  return { id: row.id, flatType: row.flatType, monthlyAmountPaise: row.monthlyAmountPaise };
}

router.get("/maintenance-rates", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can view maintenance rates" });
    return;
  }

  const rows = await db.select().from(maintenanceRatesTable);
  res.status(200).json(ListMaintenanceRatesResponse.parse(rows.map(toMaintenanceRate)));
});

router.put("/maintenance-rates/:flatType", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can update maintenance rates" });
    return;
  }

  const flatType = req.params.flatType as FlatType;
  if (!(flatTypes as readonly string[]).includes(flatType)) {
    res.status(400).json({ error: "Unknown flat type" });
    return;
  }

  const parsed = UpdateMaintenanceRateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(maintenanceRatesTable).where(eq(maintenanceRatesTable.flatType, flatType));

  const row = existing
    ? (
        await db
          .update(maintenanceRatesTable)
          .set(parsed.data)
          .where(eq(maintenanceRatesTable.id, existing.id))
          .returning()
      )[0]
    : (
        await db
          .insert(maintenanceRatesTable)
          .values({ flatType, monthlyAmountPaise: parsed.data.monthlyAmountPaise })
          .returning()
      )[0];

  res.status(200).json(UpdateMaintenanceRateResponse.parse(toMaintenanceRate(row)));
});

export default router;
