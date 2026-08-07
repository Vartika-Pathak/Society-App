import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const vendorsTable = sqliteTable("vendors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  contactPersonName: text("contact_person_name").notNull(),
  contactNumber: text("contact_number").notNull(),
  address: text("address"),
  gstNumber: text("gst_number"),
  // Smallest currency unit (paise), matching the integer-money convention used elsewhere
  // (e.g. amenityBookingsTable.amountPaidCents) to avoid floating-point rounding.
  openingBalancePaise: integer("opening_balance_paise").notNull().default(0),
});

export type Vendor = typeof vendorsTable.$inferSelect;
