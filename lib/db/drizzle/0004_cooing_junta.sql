CREATE TABLE `society` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`address` text NOT NULL,
	`contact_number` text NOT NULL,
	`email` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `buildings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`total_flats` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `flats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`building_id` integer NOT NULL,
	`flat_number` text NOT NULL,
	`flat_type` text NOT NULL,
	`occupied` integer DEFAULT false NOT NULL,
	`ownership_type` text DEFAULT 'owner' NOT NULL,
	FOREIGN KEY (`building_id`) REFERENCES `buildings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `expense_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`gst_slab_percent` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `vendors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`contact_person_name` text NOT NULL,
	`contact_number` text NOT NULL,
	`address` text,
	`gst_number` text,
	`opening_balance_paise` integer DEFAULT 0 NOT NULL
);
