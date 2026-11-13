CREATE TABLE `audit_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`actor` text NOT NULL,
	`via` text NOT NULL,
	`action` text NOT NULL,
	`visit_id` integer,
	`event_id` integer,
	`device_id` integer,
	`details` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`visit_id`) REFERENCES `visit`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`device_id`) REFERENCES `device`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `audit_log_at_idx` ON `audit_log` (`created_at`);--> statement-breakpoint
CREATE TABLE `device` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`pairing_code_hash` text,
	`pairing_expires_at` integer,
	`paired_at` integer,
	`last_seen_at` integer,
	`revoked_at` integer,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `event` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT "event_dates" CHECK("event"."end_date" >= "event"."start_date")
);
--> statement-breakpoint
CREATE INDEX `event_dates_idx` ON `event` (`start_date`,`end_date`);--> statement-breakpoint
CREATE TABLE `event_guest` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` integer NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`company` text NOT NULL,
	`search_name` text NOT NULL,
	`added_on_site` integer DEFAULT false NOT NULL,
	`signed_visit_id` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`signed_visit_id`) REFERENCES `visit`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `event_guest_search_idx` ON `event_guest` (`event_id`,`search_name`);--> statement-breakpoint
CREATE TABLE `notice_version` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`body_md` text NOT NULL,
	`published_by` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `setting` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `visit` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`company` text NOT NULL,
	`host` text,
	`search_name` text NOT NULL,
	`event_id` integer,
	`event_guest_id` integer,
	`notice_version_id` integer,
	`signature` blob,
	`check_in_at` integer NOT NULL,
	`check_out_at` integer,
	`check_out_by` text,
	`device_id` integer,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`event_guest_id`) REFERENCES `event_guest`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`notice_version_id`) REFERENCES `notice_version`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`device_id`) REFERENCES `device`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "visit_signature" CHECK(("visit"."signature" IS NULL) = ("visit"."notice_version_id" IS NULL)),
	CONSTRAINT "visit_check_out" CHECK(("visit"."check_out_at" IS NULL) = ("visit"."check_out_by" IS NULL))
);
--> statement-breakpoint
CREATE INDEX `visit_check_in_idx` ON `visit` (`check_in_at`);--> statement-breakpoint
CREATE INDEX `visit_check_out_idx` ON `visit` (`check_out_at`);--> statement-breakpoint
CREATE INDEX `visit_search_idx` ON `visit` (`search_name`);