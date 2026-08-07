import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, societyRulesTable, type SocietyRule } from "@workspace/db";
import {
  ListSocietyRulesResponse,
  CreateSocietyRuleBody,
  CreateSocietyRuleResponse,
  UpdateSocietyRuleBody,
  UpdateSocietyRuleResponse,
} from "@workspace/api-zod";
import { getAuthedUser } from "../lib/auth";

const router: IRouter = Router();

function toSocietyRule(row: SocietyRule) {
  return { id: row.id, title: row.title, description: row.description, active: row.active };
}

router.get("/society-rules", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can view society rules" });
    return;
  }

  const rows = await db.select().from(societyRulesTable);
  res.status(200).json(ListSocietyRulesResponse.parse(rows.map(toSocietyRule)));
});

router.post("/society-rules", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can add society rules" });
    return;
  }

  const parsed = CreateSocietyRuleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [created] = await db.insert(societyRulesTable).values(parsed.data).returning();
  res.status(201).json(CreateSocietyRuleResponse.parse(toSocietyRule(created)));
});

router.put("/society-rules/:id", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can update society rules" });
    return;
  }

  const id = Number(req.params.id);
  const parsed = UpdateSocietyRuleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db.update(societyRulesTable).set(parsed.data).where(eq(societyRulesTable.id, id)).returning();

  if (!updated) {
    res.status(404).json({ error: "Society rule not found" });
    return;
  }

  res.status(200).json(UpdateSocietyRuleResponse.parse(toSocietyRule(updated)));
});

router.delete("/society-rules/:id", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can delete society rules" });
    return;
  }

  const id = Number(req.params.id);
  const [deleted] = await db.delete(societyRulesTable).where(eq(societyRulesTable.id, id)).returning();

  if (!deleted) {
    res.status(404).json({ error: "Society rule not found" });
    return;
  }

  res.status(204).send();
});

export default router;
