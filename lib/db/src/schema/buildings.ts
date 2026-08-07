import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const buildingsTable = sqliteTable("buildings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  totalFlats: integer("total_flats").notNull(),
});

export type Building = typeof buildingsTable.$inferSelect;
