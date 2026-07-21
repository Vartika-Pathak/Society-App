import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { usersTable } from "./users";

export const complaintCategories = ["maintenance", "security", "noise", "other"] as const;
export type ComplaintCategory = (typeof complaintCategories)[number];

export const complaintStatuses = ["open", "in_progress", "resolved"] as const;
export type ComplaintStatus = (typeof complaintStatuses)[number];

export const complaintsTable = sqliteTable("complaints", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  residentId: integer("resident_id").notNull().references(() => usersTable.id),
  category: text("category").$type<ComplaintCategory>().notNull(),
  description: text("description").notNull(),
  status: text("status").$type<ComplaintStatus>().notNull().default("open"),
  resolutionNote: text("resolution_note"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export type Complaint = typeof complaintsTable.$inferSelect;
