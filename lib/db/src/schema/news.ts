import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const newsPostsTable = pgTable("news_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  author: text("author").notNull(),
  imageUrl: text("image_url"),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertNewsPostSchema = createInsertSchema(newsPostsTable).omit({ id: true, publishedAt: true });
export type InsertNewsPost = z.infer<typeof insertNewsPostSchema>;
export type NewsPost = typeof newsPostsTable.$inferSelect;
