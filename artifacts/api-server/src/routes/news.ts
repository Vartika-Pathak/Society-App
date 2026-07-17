import { Router, type IRouter } from "express";
import { db, newsPostsTable } from "@workspace/db";
import {
  ListNewsPostsResponse,
  GetLatestNewsPostsResponse,
  GetNewsPostParams,
  GetNewsPostResponse,
  CreateNewsPostBody,
  CreateNewsPostResponse,
  DeleteNewsPostParams,
} from "@workspace/api-zod";
import { desc, eq } from "drizzle-orm";

const router: IRouter = Router();

function serializePost(p: typeof newsPostsTable.$inferSelect) {
  return {
    ...p,
    publishedAt: p.publishedAt.toISOString(),
  };
}

router.get("/news/latest", async (_req, res): Promise<void> => {
  const posts = await db.select().from(newsPostsTable).orderBy(desc(newsPostsTable.publishedAt)).limit(3);
  res.json(GetLatestNewsPostsResponse.parse(posts.map(serializePost)));
});

router.get("/news", async (_req, res): Promise<void> => {
  const posts = await db.select().from(newsPostsTable).orderBy(desc(newsPostsTable.publishedAt));
  res.json(ListNewsPostsResponse.parse(posts.map(serializePost)));
});

router.get("/news/:id", async (req, res): Promise<void> => {
  const params = GetNewsPostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [post] = await db.select().from(newsPostsTable).where(eq(newsPostsTable.id, params.data.id));
  if (!post) {
    res.status(404).json({ error: "News post not found" });
    return;
  }
  res.json(GetNewsPostResponse.parse(serializePost(post)));
});

router.post("/news", async (req, res): Promise<void> => {
  const parsed = CreateNewsPostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [post] = await db.insert(newsPostsTable).values(parsed.data).returning();
  res.status(201).json(CreateNewsPostResponse.parse(serializePost(post)));
});

router.delete("/news/:id", async (req, res): Promise<void> => {
  const params = DeleteNewsPostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [post] = await db.delete(newsPostsTable).where(eq(newsPostsTable.id, params.data.id)).returning();
  if (!post) {
    res.status(404).json({ error: "News post not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
