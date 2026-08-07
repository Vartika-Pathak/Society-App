import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { flatsTable } from "./flats";

export const collectionPaymentModes = ["cash", "cheque", "upi", "bank_transfer"] as const;
export type CollectionPaymentMode = (typeof collectionPaymentModes)[number];

// A maintenance payment recorded against a flat — flats aren't linked to resident
// accounts (those live in the separate Java-backed login system), so this is
// admin bookkeeping keyed by flat, with the payer's name typed in at entry time,
// same denormalized-name convention used by maintenanceRequests/complaints.
export const maintenanceCollectionsTable = sqliteTable("maintenance_collections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  flatId: integer("flat_id")
    .notNull()
    .references(() => flatsTable.id),
  payerName: text("payer_name").notNull(),
  amountPaise: integer("amount_paise").notNull(),
  paymentDate: text("payment_date").notNull(),
  paymentMode: text("payment_mode").$type<CollectionPaymentMode>().notNull(),
  forMonth: text("for_month").notNull(),
  referenceNumber: text("reference_number"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export type MaintenanceCollection = typeof maintenanceCollectionsTable.$inferSelect;
