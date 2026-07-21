import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const newsPostsTable = sqliteTable("news_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  author: text("author").notNull(),
  imageUrl: text("image_url"),
  publishedAt: integer("published_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const insertNewsPostSchema = createInsertSchema(newsPostsTable).omit({ id: true, publishedAt: true });
export type InsertNewsPost = z.infer<typeof insertNewsPostSchema>;
export type NewsPost = typeof newsPostsTable.$inferSelect;
