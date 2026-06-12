CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
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
CREATE TABLE `document_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`version` integer NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL,
	`created_by` text NOT NULL,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`advisor_id` text NOT NULL,
	`title` text NOT NULL,
	`content_type` text NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`advisor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `findings` (
	`id` text PRIMARY KEY NOT NULL,
	`review_id` text NOT NULL,
	`source` text NOT NULL,
	`rule_id` text NOT NULL,
	`category` text NOT NULL,
	`severity` text NOT NULL,
	`start_offset` integer NOT NULL,
	`end_offset` integer NOT NULL,
	`matched_text` text NOT NULL,
	`explanation` text NOT NULL,
	`citation` text NOT NULL,
	`suggested_fix` text,
	FOREIGN KEY (`review_id`) REFERENCES `reviews`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`version_id` text NOT NULL,
	`risk_score` real NOT NULL,
	`risk_breakdown` text NOT NULL,
	`rewrite` text,
	`rewrite_diff` text,
	`pipeline_log` text NOT NULL,
	`provider` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`version_id`) REFERENCES `document_versions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `rule_overrides` (
	`id` text PRIMARY KEY NOT NULL,
	`rule_id` text NOT NULL,
	`firm_id` text NOT NULL,
	`enabled` integer NOT NULL,
	`updated_by` text NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`rule_id`) REFERENCES `rules`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `rules` (
	`id` text PRIMARY KEY NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`category` text NOT NULL,
	`severity` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`citation` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`firm_id` text DEFAULT 'default' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);