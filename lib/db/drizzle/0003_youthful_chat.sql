PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_visits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`resident_id` integer NOT NULL,
	`resident_name` text NOT NULL,
	`resident_flat_number` text NOT NULL,
	`visit_type` text NOT NULL,
	`visitor_name` text NOT NULL,
	`visitor_phone` text,
	`otp_code` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`approved_by` integer,
	`responded_at` integer,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_visits`("id", "resident_id", "resident_name", "resident_flat_number", "visit_type", "visitor_name", "visitor_phone", "otp_code", "status", "approved_by", "responded_at", "expires_at", "created_at") SELECT "id", "resident_id", "resident_name", "resident_flat_number", "visit_type", "visitor_name", "visitor_phone", "otp_code", "status", "approved_by", "responded_at", "expires_at", "created_at" FROM `visits`;--> statement-breakpoint
DROP TABLE `visits`;--> statement-breakpoint
ALTER TABLE `__new_visits` RENAME TO `visits`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_maintenance_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`resident_id` integer NOT NULL,
	`resident_name` text NOT NULL,
	`resident_flat_number` text NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`photo_urls` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_maintenance_requests`("id", "resident_id", "resident_name", "resident_flat_number", "category", "description", "photo_urls", "status", "created_at", "updated_at") SELECT "id", "resident_id", "resident_name", "resident_flat_number", "category", "description", "photo_urls", "status", "created_at", "updated_at" FROM `maintenance_requests`;--> statement-breakpoint
DROP TABLE `maintenance_requests`;--> statement-breakpoint
ALTER TABLE `__new_maintenance_requests` RENAME TO `maintenance_requests`;--> statement-breakpoint
CREATE TABLE `__new_complaints` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`resident_id` integer NOT NULL,
	`resident_name` text NOT NULL,
	`resident_flat_number` text NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`resolution_note` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_complaints`("id", "resident_id", "resident_name", "resident_flat_number", "category", "description", "status", "resolution_note", "created_at", "updated_at") SELECT "id", "resident_id", "resident_name", "resident_flat_number", "category", "description", "status", "resolution_note", "created_at", "updated_at" FROM `complaints`;--> statement-breakpoint
DROP TABLE `complaints`;--> statement-breakpoint
ALTER TABLE `__new_complaints` RENAME TO `complaints`;--> statement-breakpoint
CREATE TABLE `__new_emergency_alerts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`resident_id` integer NOT NULL,
	`resident_name` text NOT NULL,
	`resident_flat_number` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`resolved_by` integer,
	`resolved_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_emergency_alerts`("id", "resident_id", "resident_name", "resident_flat_number", "status", "resolved_by", "resolved_at", "created_at") SELECT "id", "resident_id", "resident_name", "resident_flat_number", "status", "resolved_by", "resolved_at", "created_at" FROM `emergency_alerts`;--> statement-breakpoint
DROP TABLE `emergency_alerts`;--> statement-breakpoint
ALTER TABLE `__new_emergency_alerts` RENAME TO `emergency_alerts`;--> statement-breakpoint
CREATE TABLE `__new_amenity_bookings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`resident_id` integer NOT NULL,
	`amenity_id` text NOT NULL,
	`booking_date` text NOT NULL,
	`slot` text NOT NULL,
	`amount_paid_cents` integer DEFAULT 0 NOT NULL,
	`stripe_session_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_amenity_bookings`("id", "resident_id", "amenity_id", "booking_date", "slot", "amount_paid_cents", "stripe_session_id", "created_at") SELECT "id", "resident_id", "amenity_id", "booking_date", "slot", "amount_paid_cents", "stripe_session_id", "created_at" FROM `amenity_bookings`;--> statement-breakpoint
DROP TABLE `amenity_bookings`;--> statement-breakpoint
ALTER TABLE `__new_amenity_bookings` RENAME TO `amenity_bookings`;