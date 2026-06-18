PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_audit_events` (
	`seq` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`id` text NOT NULL,
	`document_id` text NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`note` text,
	`payload_hash` text NOT NULL,
	`prev_hash` text NOT NULL,
	`hash` text NOT NULL,
	`timestamp` integer NOT NULL,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_audit_events`("id", "document_id", "actor", "action", "note", "payload_hash", "prev_hash", "hash", "timestamp") SELECT "id", "document_id", "actor", "action", "note", "payload_hash", "prev_hash", "hash", "timestamp" FROM `audit_events`;--> statement-breakpoint
DROP TABLE `audit_events`;--> statement-breakpoint
ALTER TABLE `__new_audit_events` RENAME TO `audit_events`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `audit_events_id_unique` ON `audit_events` (`id`);