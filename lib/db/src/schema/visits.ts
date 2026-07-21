import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const visitTypes = ["cab_delivery", "guest", "household_help"] as const;
export type VisitType = (typeof visitTypes)[number];

export const visitStatuses = ["pending", "approved", "denied"] as const;
export type VisitStatus = (typeof visitStatuses)[number];

export const visitsTable = sqliteTable("visits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  residentId: integer("resident_id").notNull().references(() => usersTable.id),
  visitType: text("visit_type").$type<VisitType>().notNull(),
  visitorName: text("visitor_name").notNull(),
  visitorPhone: text("visitor_phone"),
  otpCode: text("otp_code").notNull(),
  status: text("status").$type<VisitStatus>().notNull().default("pending"),
  approvedBy: integer("approved_by").references(() => usersTable.id),
  respondedAt: integer("responded_at", { mode: "timestamp" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const visitTypeSchema = z.enum(visitTypes);
export type Visit = typeof visitsTable.$inferSelect;
