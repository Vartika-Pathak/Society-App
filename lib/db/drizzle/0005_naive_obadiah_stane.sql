CREATE TABLE `maintenance_rates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`flat_type` text NOT NULL,
	`monthly_amount_paise` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `maintenance_rates_flat_type_unique` ON `maintenance_rates` (`flat_type`);--> statement-breakpoint
CREATE TABLE `maintenance_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`due_day` integer DEFAULT 10 NOT NULL,
	`late_fee_percent` integer DEFAULT 0 NOT NULL,
	`opening_balance_note` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `maintenance_discounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`discount_type` text NOT NULL,
	`value` integer NOT NULL,
	`description` text,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `special_contributions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`amount_paise` integer NOT NULL,
	`due_date` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `vendor_bills` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vendor_id` integer NOT NULL,
	`expense_category_id` integer NOT NULL,
	`bill_number` text NOT NULL,
	`bill_date` text NOT NULL,
	`amount_paise` integer NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`expense_category_id`) REFERENCES `expense_categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bill_payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vendor_bill_id` integer NOT NULL,
	`amount_paise` integer NOT NULL,
	`payment_date` text NOT NULL,
	`payment_mode` text NOT NULL,
	`reference_number` text,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`vendor_bill_id`) REFERENCES `vendor_bills`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `maintenance_collections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`flat_id` integer NOT NULL,
	`payer_name` text NOT NULL,
	`amount_paise` integer NOT NULL,
	`payment_date` text NOT NULL,
	`payment_mode` text NOT NULL,
	`for_month` text NOT NULL,
	`reference_number` text,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`flat_id`) REFERENCES `flats`(`id`) ON UPDATE no action ON DELETE no action
);
