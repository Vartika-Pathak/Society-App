import { Router, type IRouter } from "express";
import { db, membersTable, eventsTable, newsPostsTable, galleryPhotosTable } from "@workspace/db";
import { GetCommunityStatsResponse } from "@workspace/api-zod";
import { count, gte } from "drizzle-orm";

const router: IRouter = Router();

router.get("/stats", async (_req, res): Promise<void> => {
  const now = new Date();
  const [[{ totalMembers }], [{ upcomingEventsCount }], [{ totalNewsPosts }], [{ totalGalleryPhotos }]] = await Promise.all([
    db.select({ totalMembers: count() }).from(membersTable),
    db.select({ upcomingEventsCount: count() }).from(eventsTable).where(gte(eventsTable.date, now)),
    db.select({ totalNewsPosts: count() }).from(newsPostsTable),
    db.select({ totalGalleryPhotos: count() }).from(galleryPhotosTable),
  ]);
  res.json(GetCommunityStatsResponse.parse({ totalMembers, upcomingEventsCount, totalNewsPosts, totalGalleryPhotos }));
});

export default router;
