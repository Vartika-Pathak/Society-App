import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { vendorBillsTable } from "./vendorBills";

export const paymentModes = ["cash", "cheque", "upi", "bank_transfer"] as const;
export type PaymentMode = (typeof paymentModes)[number];

export const billPaymentsTable = sqliteTable("bill_payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  vendorBillId: integer("vendor_bill_id")
    .notNull()
    .references(() => vendorBillsTable.id),
  amountPaise: integer("amount_paise").notNull(),
  paymentDate: text("payment_date").notNull(),
  paymentMode: text("payment_mode").$type<PaymentMode>().notNull(),
  referenceNumber: text("reference_number"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export type BillPayment = typeof billPaymentsTable.$inferSelect;
