import { Router, type IRouter } from "express";
import { db, residentMeetingsTable } from "@workspace/db";
import { gte, asc } from "drizzle-orm";

const router: IRouter = Router();

function serializeMeeting(m: typeof residentMeetingsTable.$inferSelect) {
  return {
    ...m,
    date: m.date.toISOString(),
  };
}

// Only ever returns upcoming meetings — once a meeting's date has passed there's nothing
// left for a resident to act on, so it drops off rather than lingering in a "past" list.
router.get("/resident-meetings", async (_req, res): Promise<void> => {
  const now = new Date();
  const meetings = await db
    .select()
    .from(residentMeetingsTable)
    .where(gte(residentMeetingsTable.date, now))
    .orderBy(asc(residentMeetingsTable.date));
  res.json(meetings.map(serializeMeeting));
});

export default router;
