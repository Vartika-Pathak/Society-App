import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { z } from "zod/v4";

export const visitTypes = ["cab_delivery", "guest", "household_help", "maintenance_staff"] as const;
export type VisitType = (typeof visitTypes)[number];

export const visitStatuses = ["pending", "approved", "denied"] as const;
export type VisitStatus = (typeof visitStatuses)[number];

export const visitsTable = sqliteTable("visits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // Not a foreign key: the resident's real account lives in the separate Java backend's
  // database, so this id (from that backend's JWT) usually has no matching row in this
  // server's own usersTable to reference.
  residentId: integer("resident_id").notNull(),
  // Denormalized at insert time rather than joined from usersTable — same reason as above.
  residentName: text("resident_name").notNull(),
  residentFlatNumber: text("resident_flat_number").notNull(),
  visitType: text("visit_type").$type<VisitType>().notNull(),
  visitorName: text("visitor_name").notNull(),
  visitorPhone: text("visitor_phone"),
  otpCode: text("otp_code").notNull(),
  status: text("status").$type<VisitStatus>().notNull().default("pending"),
  approvedBy: integer("approved_by"),
  respondedAt: integer("responded_at", { mode: "timestamp" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const visitTypeSchema = z.enum(visitTypes);
export type Visit = typeof visitsTable.$inferSelect;
