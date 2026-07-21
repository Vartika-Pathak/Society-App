import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { usersTable } from "./users";

export const emergencyAlertStatuses = ["active", "resolved"] as const;
export type EmergencyAlertStatus = (typeof emergencyAlertStatuses)[number];

export const emergencyAlertsTable = sqliteTable("emergency_alerts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  residentId: integer("resident_id").notNull().references(() => usersTable.id),
  status: text("status").$type<EmergencyAlertStatus>().notNull().default("active"),
  resolvedBy: integer("resolved_by").references(() => usersTable.id),
  resolvedAt: integer("resolved_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export type EmergencyAlert = typeof emergencyAlertsTable.$inferSelect;
