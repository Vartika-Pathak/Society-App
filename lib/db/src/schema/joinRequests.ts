import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const joinRequestsTable = sqliteTable("join_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  flatNumber: text("flat_number").notNull(),
  message: text("message"),
  status: text("status").notNull().default("pending"),
  submittedAt: integer("submitted_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const insertJoinRequestSchema = createInsertSchema(joinRequestsTable).omit({ id: true, status: true, submittedAt: true });
export type InsertJoinRequest = z.infer<typeof insertJoinRequestSchema>;
export type JoinRequest = typeof joinRequestsTable.$inferSelect;
