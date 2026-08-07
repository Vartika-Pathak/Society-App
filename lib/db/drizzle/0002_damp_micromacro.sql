ALTER TABLE `visits` ADD `resident_name` text NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `visits` ADD `resident_flat_number` text NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `maintenance_requests` ADD `resident_name` text NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `maintenance_requests` ADD `resident_flat_number` text NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `complaints` ADD `resident_name` text NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `complaints` ADD `resident_flat_number` text NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `emergency_alerts` ADD `resident_name` text NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `emergency_alerts` ADD `resident_flat_number` text NOT NULL DEFAULT '';
