import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const expenseCategoriesTable = sqliteTable("expense_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  gstSlabPercent: integer("gst_slab_percent").notNull(),
});

export type ExpenseCategory = typeof expenseCategoriesTable.$inferSelect;
