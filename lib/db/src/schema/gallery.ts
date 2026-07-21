import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const galleryPhotosTable = sqliteTable("gallery_photos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  imageUrl: text("image_url").notNull(),
  title: text("title"),
  description: text("description"),
  uploadedBy: text("uploaded_by"),
  uploadedAt: integer("uploaded_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const insertGalleryPhotoSchema = createInsertSchema(galleryPhotosTable).omit({ id: true, uploadedAt: true });
export type InsertGalleryPhoto = z.infer<typeof insertGalleryPhotoSchema>;
export type GalleryPhoto = typeof galleryPhotosTable.$inferSelect;
