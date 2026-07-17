import { Router, type IRouter } from "express";
import { db, galleryPhotosTable } from "@workspace/db";
import {
  ListGalleryPhotosResponse,
  AddGalleryPhotoBody,
  AddGalleryPhotoResponse,
  DeleteGalleryPhotoParams,
} from "@workspace/api-zod";
import { desc, eq } from "drizzle-orm";

const router: IRouter = Router();

function serializePhoto(p: typeof galleryPhotosTable.$inferSelect) {
  return {
    ...p,
    uploadedAt: p.uploadedAt.toISOString(),
  };
}

router.get("/gallery", async (_req, res): Promise<void> => {
  const photos = await db.select().from(galleryPhotosTable).orderBy(desc(galleryPhotosTable.uploadedAt));
  res.json(ListGalleryPhotosResponse.parse(photos.map(serializePhoto)));
});

router.post("/gallery", async (req, res): Promise<void> => {
  const parsed = AddGalleryPhotoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [photo] = await db.insert(galleryPhotosTable).values(parsed.data).returning();
  res.status(201).json(AddGalleryPhotoResponse.parse(serializePhoto(photo)));
});

router.delete("/gallery/:id", async (req, res): Promise<void> => {
  const params = DeleteGalleryPhotoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [photo] = await db.delete(galleryPhotosTable).where(eq(galleryPhotosTable.id, params.data.id)).returning();
  if (!photo) {
    res.status(404).json({ error: "Photo not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
