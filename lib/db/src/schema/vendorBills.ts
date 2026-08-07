import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { vendorsTable } from "./vendors";
import { expenseCategoriesTable } from "./expenseCategories";

// A vendor's bill for a maintenance expense — how much is actually paid
// against it lives in billPaymentsTable and is summed at read time rather
// than duplicated here, so there's one source of truth for "paid so far".
export const vendorBillsTable = sqliteTable("vendor_bills", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  vendorId: integer("vendor_id")
    .notNull()
    .references(() => vendorsTable.id),
  expenseCategoryId: integer("expense_category_id")
    .notNull()
    .references(() => expenseCategoriesTable.id),
  billNumber: text("bill_number").notNull(),
  billDate: text("bill_date").notNull(),
  amountPaise: integer("amount_paise").notNull(),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export type VendorBill = typeof vendorBillsTable.$inferSelect;
