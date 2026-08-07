import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, noticesTable, type Notice } from "@workspace/db";
import {
  ListNoticesResponse,
  CreateNoticeBody,
  CreateNoticeResponse,
  UpdateNoticeBody,
  UpdateNoticeResponse,
} from "@workspace/api-zod";
import { getAuthedUser } from "../lib/auth";

const router: IRouter = Router();

function toNotice(row: Notice) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    category: row.category,
    priority: row.priority,
    pinned: row.pinned,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/notices", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can view notices" });
    return;
  }

  const rows = await db.select().from(noticesTable).orderBy(desc(noticesTable.pinned), desc(noticesTable.createdAt));
  res.status(200).json(ListNoticesResponse.parse(rows.map(toNotice)));
});

router.post("/notices", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can create notices" });
    return;
  }

  const parsed = CreateNoticeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [created] = await db.insert(noticesTable).values(parsed.data).returning();
  res.status(201).json(CreateNoticeResponse.parse(toNotice(created)));
});

router.put("/notices/:id", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can update notices" });
    return;
  }

  const id = Number(req.params.id);
  const parsed = UpdateNoticeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db.update(noticesTable).set(parsed.data).where(eq(noticesTable.id, id)).returning();

  if (!updated) {
    res.status(404).json({ error: "Notice not found" });
    return;
  }

  res.status(200).json(UpdateNoticeResponse.parse(toNotice(updated)));
});

router.delete("/notices/:id", async (req, res): Promise<void> => {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can delete notices" });
    return;
  }

  const id = Number(req.params.id);
  const [deleted] = await db.delete(noticesTable).where(eq(noticesTable.id, id)).returning();

  if (!deleted) {
    res.status(404).json({ error: "Notice not found" });
    return;
  }

  res.status(204).send();
});

export default router;
