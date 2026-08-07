import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, buildingsTable, flatsTable, type Building } from "@workspace/db";
import { ListBuildingsResponse, CreateBuildingBody, CreateBuildingResponse, UpdateBuildingBody, UpdateBuildingResponse } from "@workspace/api-zod";
import { getAuthedUser } from "../lib/auth";

const router: IRouter = Router();

function toBuilding(row: Building) {
  return { id: row.id, name: row.name, totalFlats: row.totalFlats };
}

router.get("/buildings", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can view buildings" });
    return;
  }

  const rows = await db.select().from(buildingsTable);
  res.status(200).json(ListBuildingsResponse.parse(rows.map(toBuilding)));
});

router.post("/buildings", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can add buildings" });
    return;
  }

  const parsed = CreateBuildingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [created] = await db.insert(buildingsTable).values(parsed.data).returning();
  res.status(201).json(CreateBuildingResponse.parse(toBuilding(created)));
});

router.put("/buildings/:id", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can update buildings" });
    return;
  }

  const id = Number(req.params.id);
  const parsed = UpdateBuildingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(buildingsTable)
    .set(parsed.data)
    .where(eq(buildingsTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Building not found" });
    return;
  }

  res.status(200).json(UpdateBuildingResponse.parse(toBuilding(updated)));
});

router.delete("/buildings/:id", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can delete buildings" });
    return;
  }

  const id = Number(req.params.id);

  const [flatInBuilding] = await db.select().from(flatsTable).where(eq(flatsTable.buildingId, id)).limit(1);
  if (flatInBuilding) {
    res.status(409).json({ error: "This building still has flats assigned to it — remove those first" });
    return;
  }

  const [deleted] = await db.delete(buildingsTable).where(eq(buildingsTable.id, id)).returning();

  if (!deleted) {
    res.status(404).json({ error: "Building not found" });
    return;
  }

  res.status(204).send();
});

export default router;
