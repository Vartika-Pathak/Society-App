import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const discountTypes = ["percent", "fixed"] as const;
export type DiscountType = (typeof discountTypes)[number];

export const maintenanceDiscountsTable = sqliteTable("maintenance_discounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  discountType: text("discount_type").$type<DiscountType>().notNull(),
  // Percent: 0-100. Fixed: paise.
  value: integer("value").notNull(),
  description: text("description"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export type MaintenanceDiscount = typeof maintenanceDiscountsTable.$inferSelect;
