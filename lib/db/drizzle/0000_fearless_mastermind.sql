CREATE TABLE `members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`flat_number` text NOT NULL,
	`bio` text,
	`avatar_url` text,
	`joined_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`date` integer NOT NULL,
	`location` text NOT NULL,
	`organizer` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `news_posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`excerpt` text,
	`author` text NOT NULL,
	`image_url` text,
	`published_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `gallery_photos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`image_url` text NOT NULL,
	`title` text,
	`description` text,
	`uploaded_by` text,
	`uploaded_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `join_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`flat_number` text NOT NULL,
	`message` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`submitted_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `contact_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`subject` text NOT NULL,
	`message` text NOT NULL,
	`submitted_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`flat_number` text NOT NULL,
	`role` text DEFAULT 'resident' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `visits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`resident_id` integer NOT NULL,
	`visit_type` text NOT NULL,
	`visitor_name` text NOT NULL,
	`visitor_phone` text,
	`otp_code` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`approved_by` integer,
	`responded_at` integer,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`resident_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `maintenance_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`resident_id` integer NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`photo_urls` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`resident_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `complaints` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`resident_id` integer NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`resolution_note` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`resident_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `emergency_alerts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`resident_id` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`resolved_by` integer,
	`resolved_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`resident_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`resolved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `amenity_bookings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`resident_id` integer NOT NULL,
	`amenity_id` text NOT NULL,
	`booking_date` text NOT NULL,
	`slot` text NOT NULL,
	`amount_paid_cents` integer DEFAULT 0 NOT NULL,
	`stripe_session_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`resident_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
