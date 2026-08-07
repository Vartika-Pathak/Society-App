import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

// A single row of society-wide maintenance billing settings — there's only ever
// one, same convention as societyTable.
export const maintenanceSettingsTable = sqliteTable("maintenance_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  dueDay: integer("due_day").notNull().default(10),
  lateFeePercent: integer("late_fee_percent").notNull().default(0),
  openingBalanceNote: text("opening_balance_note").notNull().default(""),
});

export type MaintenanceSettingsRow = typeof maintenanceSettingsTable.$inferSelect;
