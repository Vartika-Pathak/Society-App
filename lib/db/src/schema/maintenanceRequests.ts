import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

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
  // Not a foreign key: the resident's real account lives in the separate Java backend's
  // database, so this id (from that backend's JWT) usually has no matching row in this
  // server's own usersTable to reference.
  residentId: integer("resident_id").notNull(),
  // Denormalized at insert time rather than joined from usersTable — same reason as above.
  residentName: text("resident_name").notNull(),
  residentFlatNumber: text("resident_flat_number").notNull(),
  category: text("category").$type<MaintenanceCategory>().notNull(),
  description: text("description").notNull(),
  photoUrls: text("photo_urls", { mode: "json" }).$type<string[]>().notNull().default([]),
  status: text("status").$type<MaintenanceStatus>().notNull().default("open"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export type MaintenanceRequest = typeof maintenanceRequestsTable.$inferSelect;
