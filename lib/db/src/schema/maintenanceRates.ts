import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import type { FlatType } from "./flats";

// One row per flat type — the monthly maintenance amount charged to flats of that type.
export const maintenanceRatesTable = sqliteTable("maintenance_rates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  flatType: text("flat_type").$type<FlatType>().notNull().unique(),
  monthlyAmountPaise: integer("monthly_amount_paise").notNull().default(0),
});

export type MaintenanceRate = typeof maintenanceRatesTable.$inferSelect;
