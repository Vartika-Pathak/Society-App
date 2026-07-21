import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { usersTable } from "./users";

export const amenitySlots = ["morning", "afternoon", "evening"] as const;
export type AmenitySlot = (typeof amenitySlots)[number];

// A booking row only exists once it's actually confirmed — free amenities
// insert immediately, paid ones insert only after Stripe confirms payment.
// There is no "pending" status to manage.
export const amenityBookingsTable = sqliteTable("amenity_bookings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  residentId: integer("resident_id").notNull().references(() => usersTable.id),
  amenityId: text("amenity_id").notNull(),
  bookingDate: text("booking_date").notNull(),
  slot: text("slot").$type<AmenitySlot>().notNull(),
  amountPaidCents: integer("amount_paid_cents").notNull().default(0),
  stripeSessionId: text("stripe_session_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export type AmenityBookingRow = typeof amenityBookingsTable.$inferSelect;
