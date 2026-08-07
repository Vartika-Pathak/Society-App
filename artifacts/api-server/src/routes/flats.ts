import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, flatsTable, buildingsTable, type Flat } from "@workspace/db";
import { ListFlatsResponse, CreateFlatBody, CreateFlatResponse, UpdateFlatBody, UpdateFlatResponse } from "@workspace/api-zod";
import { getAuthedUser } from "../lib/auth";

const router: IRouter = Router();

function toFlat(row: Flat, buildingName: string) {
  return {
    id: row.id,
    buildingId: row.buildingId,
    buildingName,
    flatNumber: row.flatNumber,
    flatType: row.flatType,
    occupied: row.occupied,
    ownershipType: row.ownershipType,
  };
}

async function buildingNameFor(buildingId: number): Promise<string | undefined> {
  const [building] = await db.select().from(buildingsTable).where(eq(buildingsTable.id, buildingId));
  return building?.name;
}

router.get("/flats", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can view flats" });
    return;
  }

  const rows = await db
    .select({ flat: flatsTable, buildingName: buildingsTable.name })
    .from(flatsTable)
    .innerJoin(buildingsTable, eq(flatsTable.buildingId, buildingsTable.id));

  res.status(200).json(ListFlatsResponse.parse(rows.map(({ flat, buildingName }) => toFlat(flat, buildingName))));
});

router.post("/flats", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can add flats" });
    return;
  }

  const parsed = CreateFlatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const buildingName = await buildingNameFor(parsed.data.buildingId);
  if (!buildingName) {
    res.status(404).json({ error: "Unknown building" });
    return;
  }

  const [created] = await db.insert(flatsTable).values(parsed.data).returning();
  res.status(201).json(CreateFlatResponse.parse(toFlat(created, buildingName)));
});

router.put("/flats/:id", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can update flats" });
    return;
  }

  const id = Number(req.params.id);
  const parsed = UpdateFlatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const buildingName = await buildingNameFor(parsed.data.buildingId);
  if (!buildingName) {
    res.status(404).json({ error: "Unknown building" });
    return;
  }

  const [updated] = await db.update(flatsTable).set(parsed.data).where(eq(flatsTable.id, id)).returning();

  if (!updated) {
    res.status(404).json({ error: "Flat not found" });
    return;
  }

  res.status(200).json(UpdateFlatResponse.parse(toFlat(updated, buildingName)));
});

router.delete("/flats/:id", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can delete flats" });
    return;
  }

  const id = Number(req.params.id);
  const [deleted] = await db.delete(flatsTable).where(eq(flatsTable.id, id)).returning();

  if (!deleted) {
    res.status(404).json({ error: "Flat not found" });
    return;
  }

  res.status(204).send();
});

export default router;
