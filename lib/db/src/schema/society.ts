import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

// A single row describing the society itself — there's only ever one, so callers always
// operate on id 1 rather than picking a row to update.
export const societyTable = sqliteTable("society", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  address: text("address").notNull(),
  contactNumber: text("contact_number").notNull(),
  email: text("email").notNull(),
});

export type SocietyRow = typeof societyTable.$inferSelect;
