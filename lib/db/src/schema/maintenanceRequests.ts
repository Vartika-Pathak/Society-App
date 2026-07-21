import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { usersTable } from "./users";

export const maintenanceCategories = [
  "plumbing",
  "electrical",
  "appliance",
  "structural",
  "other",
] as const;
export type MaintenanceCategory = (typeof maintenanceCategories)[number];

export const maintenanceStatuses = ["open", "in_progress", "resolved"] as const;
export type MaintenanceStatus = (typeof maintenanceStatuses)[number];

export const maintenanceRequestsTable = sqliteTable("maintenance_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  residentId: integer("resident_id").notNull().references(() => usersTable.id),
  category: text("category").$type<MaintenanceCategory>().notNull(),
  description: text("description").notNull(),
  photoUrls: text("photo_urls", { mode: "json" }).$type<string[]>().notNull().default([]),
  status: text("status").$type<MaintenanceStatus>().notNull().default("open"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export type MaintenanceRequest = typeof maintenanceRequestsTable.$inferSelect;
