import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { buildingsTable } from "./buildings";

export const flatTypes = ["1bhk", "2bhk", "3bhk", "4bhk"] as const;
export type FlatType = (typeof flatTypes)[number];

export const ownershipTypes = ["owner", "rented"] as const;
export type OwnershipType = (typeof ownershipTypes)[number];

export const flatsTable = sqliteTable("flats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  buildingId: integer("building_id")
    .notNull()
    .references(() => buildingsTable.id),
  flatNumber: text("flat_number").notNull(),
  flatType: text("flat_type").$type<FlatType>().notNull(),
  occupied: integer("occupied", { mode: "boolean" }).notNull().default(false),
  ownershipType: text("ownership_type").$type<OwnershipType>().notNull().default("owner"),
});

export type Flat = typeof flatsTable.$inferSelect;
