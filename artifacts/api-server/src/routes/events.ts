import { Router, type IRouter } from "express";
import { db, eventsTable } from "@workspace/db";
import {
  ListEventsResponse,
  GetUpcomingEventsResponse,
  GetEventParams,
  GetEventResponse,
  CreateEventBody,
  CreateEventResponse,
  DeleteEventParams,
} from "@workspace/api-zod";
import { eq, gte, asc } from "drizzle-orm";

const router: IRouter = Router();

function serializeEvent(e: typeof eventsTable.$inferSelect) {
  return {
    ...e,
    date: e.date.toISOString(),
    createdAt: e.createdAt.toISOString(),
  };
}

router.get("/events/upcoming", async (_req, res): Promise<void> => {
  const now = new Date();
  const events = await db
    .select()
    .from(eventsTable)
    .where(gte(eventsTable.date, now))
    .orderBy(asc(eventsTable.date))
    .limit(5);
  res.json(GetUpcomingEventsResponse.parse(events.map(serializeEvent)));
});

router.get("/events", async (_req, res): Promise<void> => {
  const events = await db.select().from(eventsTable).orderBy(asc(eventsTable.date));
  res.json(ListEventsResponse.parse(events.map(serializeEvent)));
});

router.get("/events/:id", async (req, res): Promise<void> => {
  const params = GetEventParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, params.data.id));
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  res.json(GetEventResponse.parse(serializeEvent(event)));
});

router.post("/events", async (req, res): Promise<void> => {
  const parsed = CreateEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [event] = await db.insert(eventsTable).values({
    ...parsed.data,
    date: new Date(parsed.data.date),
  }).returning();
  res.status(201).json(CreateEventResponse.parse(serializeEvent(event)));
});

router.delete("/events/:id", async (req, res): Promise<void> => {
  const params = DeleteEventParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [event] = await db.delete(eventsTable).where(eq(eventsTable.id, params.data.id)).returning();
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
