import { eq } from "drizzle-orm";
import { db } from "./index";
import { eventsTable } from "./schema/events";
import { festivalAndCommunityEvents } from "./seed-data/events";
import { galleryPhotosTable } from "./schema/gallery";
import { communityGalleryPhotos } from "./seed-data/gallery";

// Idempotent: only inserts events whose title isn't already present, so this
// is safe to call on every server startup (cheap no-op after the first run)
// as well as from a one-off script.
export async function seedEvents(): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;

  for (const event of festivalAndCommunityEvents) {
    const existing = await db.select().from(eventsTable).where(eq(eventsTable.title, event.title));
    if (existing.length > 0) {
      skipped++;
      continue;
    }
    await db.insert(eventsTable).values(event);
    inserted++;
  }

  return { inserted, skipped };
}

// Idempotent (checks by title before inserting), same reasoning as seedEvents above.
export async function seedGallery(): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;

  for (const photo of communityGalleryPhotos) {
    const existing = await db.select().from(galleryPhotosTable).where(eq(galleryPhotosTable.title, photo.title!));
    if (existing.length > 0) {
      skipped++;
      continue;
    }
    await db.insert(galleryPhotosTable).values(photo);
    inserted++;
  }

  return { inserted, skipped };
}
