import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const amenitySlots = ["morning", "afternoon", "evening"] as const;
export type AmenitySlot = (typeof amenitySlots)[number];

// A booking row only exists once it's actually confirmed — free amenities
// insert immediately, paid ones insert only after Stripe confirms payment.
// There is no "pending" status to manage.
export const amenityBookingsTable = sqliteTable("amenity_bookings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // Not a foreign key: the resident's real account lives in the separate Java backend's
  // database, so this id (from that backend's JWT) usually has no matching row in this
  // server's own usersTable to reference.
  residentId: integer("resident_id").notNull(),
  amenityId: text("amenity_id").notNull(),
  bookingDate: text("booking_date").notNull(),
  slot: text("slot").$type<AmenitySlot>().notNull(),
  amountPaidCents: integer("amount_paid_cents").notNull().default(0),
  stripeSessionId: text("stripe_session_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export type AmenityBookingRow = typeof amenityBookingsTable.$inferSelect;
