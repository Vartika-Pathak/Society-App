import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, maintenanceSettingsTable, type MaintenanceSettingsRow } from "@workspace/db";
import { GetMaintenanceSettingsResponse, UpdateMaintenanceSettingsBody, UpdateMaintenanceSettingsResponse } from "@workspace/api-zod";
import { getAuthedUser } from "../lib/auth";

const router: IRouter = Router();

function toSettings(row: MaintenanceSettingsRow) {
  return {
    id: row.id,
    dueDay: row.dueDay,
    lateFeePercent: row.lateFeePercent,
    openingBalanceNote: row.openingBalanceNote,
  };
}

// There's only ever one settings row — this fetches it, creating a default the
// first time anyone asks, so the admin has something to edit instead of a 404.
async function getOrCreateSettings(): Promise<MaintenanceSettingsRow> {
  const [existing] = await db.select().from(maintenanceSettingsTable).limit(1);
  if (existing) return existing;

  const [created] = await db.insert(maintenanceSettingsTable).values({}).returning();
  return created;
}

router.get("/maintenance-settings", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can view maintenance settings" });
    return;
  }

  const settings = await getOrCreateSettings();
  res.status(200).json(GetMaintenanceSettingsResponse.parse(toSettings(settings)));
});

router.put("/maintenance-settings", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can update maintenance settings" });
    return;
  }

  const parsed = UpdateMaintenanceSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await getOrCreateSettings();
  const [updated] = await db
    .update(maintenanceSettingsTable)
    .set(parsed.data)
    .where(eq(maintenanceSettingsTable.id, existing.id))
    .returning();

  res.status(200).json(UpdateMaintenanceSettingsResponse.parse(toSettings(updated)));
});

export default router;
