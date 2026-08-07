import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// A directory of local services (plumber, electrician, milkman, etc.) residents can
// call directly — not tied to a vendor bill/contract, just contact info to look up.
export const servicesTable = sqliteTable("services", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category").notNull(),
  contactNumber: text("contact_number").notNull(),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export type Service = typeof servicesTable.$inferSelect;
