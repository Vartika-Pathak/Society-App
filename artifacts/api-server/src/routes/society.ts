import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, societyTable, type SocietyRow } from "@workspace/db";
import { GetSocietyInfoResponse, UpdateSocietyInfoBody, UpdateSocietyInfoResponse } from "@workspace/api-zod";
import { getAuthedUser } from "../lib/auth";

const router: IRouter = Router();

function toSocietyInfo(row: SocietyRow) {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    contactNumber: row.contactNumber,
    email: row.email,
  };
}

// There's only ever one society row — this fetches it, creating a blank default the first
// time anyone asks, so the admin has something to edit instead of hitting a 404.
async function getOrCreateSociety(): Promise<SocietyRow> {
  const [existing] = await db.select().from(societyTable).limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(societyTable)
    .values({ name: "", address: "", contactNumber: "", email: "" })
    .returning();
  return created;
}

router.get("/society-info", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can view society settings" });
    return;
  }

  const society = await getOrCreateSociety();
  res.status(200).json(GetSocietyInfoResponse.parse(toSocietyInfo(society)));
});

router.put("/society-info", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can update society settings" });
    return;
  }

  const parsed = UpdateSocietyInfoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await getOrCreateSociety();
  const [updated] = await db
    .update(societyTable)
    .set(parsed.data)
    .where(eq(societyTable.id, existing.id))
    .returning();

  res.status(200).json(UpdateSocietyInfoResponse.parse(toSocietyInfo(updated)));
});

export default router;
