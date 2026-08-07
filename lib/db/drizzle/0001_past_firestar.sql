CREATE TABLE `resident_meetings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`date` integer NOT NULL,
	`location` text NOT NULL,
	`notes` text
);
