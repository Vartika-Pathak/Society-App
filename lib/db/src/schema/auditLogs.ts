import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// One row per successful admin write (create/update/delete) across the Masters and
// Transactions endpoints — populated by a middleware, not by each route handler, so
// new admin resources get audited automatically without extra code at each call site.
export const auditLogsTable = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  adminId: integer("admin_id").notNull(),
  adminName: text("admin_name").notNull(),
  method: text("method").notNull(),
  path: text("path").notNull(),
  statusCode: integer("status_code").notNull(),
  summary: text("summary").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export type AuditLog = typeof auditLogsTable.$inferSelect;
