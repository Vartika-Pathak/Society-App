import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const emergencyAlertStatuses = ["active", "resolved"] as const;
export type EmergencyAlertStatus = (typeof emergencyAlertStatuses)[number];

export const emergencyAlertsTable = sqliteTable("emergency_alerts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // Not a foreign key: the resident's real account lives in the separate Java backend's
  // database, so this id (from that backend's JWT) usually has no matching row in this
  // server's own usersTable to reference.
  residentId: integer("resident_id").notNull(),
  // Denormalized at insert time rather than joined from usersTable — same reason as above.
  residentName: text("resident_name").notNull(),
  residentFlatNumber: text("resident_flat_number").notNull(),
  status: text("status").$type<EmergencyAlertStatus>().notNull().default("active"),
  resolvedBy: integer("resolved_by"),
  resolvedAt: integer("resolved_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export type EmergencyAlert = typeof emergencyAlertsTable.$inferSelect;
