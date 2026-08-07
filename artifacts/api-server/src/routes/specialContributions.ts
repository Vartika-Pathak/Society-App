import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, specialContributionsTable, type SpecialContribution } from "@workspace/db";
import {
  ListSpecialContributionsResponse,
  CreateSpecialContributionBody,
  CreateSpecialContributionResponse,
} from "@workspace/api-zod";
import { getAuthedUser } from "../lib/auth";

const router: IRouter = Router();

function toSpecialContribution(row: SpecialContribution) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    amountPaise: row.amountPaise,
    dueDate: row.dueDate,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/special-contributions", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can view special contributions" });
    return;
  }

  const rows = await db.select().from(specialContributionsTable);
  res.status(200).json(ListSpecialContributionsResponse.parse(rows.map(toSpecialContribution)));
});

router.post("/special-contributions", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can add special contributions" });
    return;
  }

  const parsed = CreateSpecialContributionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [created] = await db.insert(specialContributionsTable).values(parsed.data).returning();
  res.status(201).json(CreateSpecialContributionResponse.parse(toSpecialContribution(created)));
});

router.delete("/special-contributions/:id", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can delete special contributions" });
    return;
  }

  const id = Number(req.params.id);
  const [deleted] = await db.delete(specialContributionsTable).where(eq(specialContributionsTable.id, id)).returning();

  if (!deleted) {
    res.status(404).json({ error: "Special contribution not found" });
    return;
  }

  res.status(204).send();
});

export default router;
