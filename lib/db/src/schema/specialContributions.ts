import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// A one-off charge announced to every flat (e.g. a festival fund, a repair
// levy) — distinct from the recurring per-flat-type maintenance rate.
export const specialContributionsTable = sqliteTable("special_contributions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  amountPaise: integer("amount_paise").notNull(),
  dueDate: text("due_date").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export type SpecialContribution = typeof specialContributionsTable.$inferSelect;
