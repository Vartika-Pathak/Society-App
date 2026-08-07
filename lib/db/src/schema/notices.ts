import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const noticeCategories = ["general", "maintenance", "event", "urgent"] as const;
export type NoticeCategory = (typeof noticeCategories)[number];

export const noticePriorities = ["low", "normal", "high"] as const;
export type NoticePriority = (typeof noticePriorities)[number];

// Distinct from newsPostsTable — notices are short, operational, and can be pinned or
// set to auto-expire, more like a bulletin board than the news/blog feed.
export const noticesTable = sqliteTable("notices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").$type<NoticeCategory>().notNull().default("general"),
  priority: text("priority").$type<NoticePriority>().notNull().default("normal"),
  pinned: integer("pinned", { mode: "boolean" }).notNull().default(false),
  expiresAt: text("expires_at"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export type Notice = typeof noticesTable.$inferSelect;
