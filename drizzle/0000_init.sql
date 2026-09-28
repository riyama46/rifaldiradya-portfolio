CREATE TABLE `admin_sessions` (
	`id` varchar(26) NOT NULL,
	`token_hash` char(64) NOT NULL,
	`created_at` datetime(3) NOT NULL,
	`expires_at` datetime(3) NOT NULL,
	`last_seen_at` datetime(3) NOT NULL,
	`user_agent` varchar(255),
	CONSTRAINT `admin_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_sessions_token_hash_unique` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `login_attempts` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`ip_hash` char(64) NOT NULL,
	`success` boolean NOT NULL,
	`created_at` datetime(3) NOT NULL,
	CONSTRAINT `login_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` varchar(26) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`title_en` varchar(80) NOT NULL,
	`title_id` varchar(80) NOT NULL,
	`summary_en` varchar(160) NOT NULL,
	`summary_id` varchar(160) NOT NULL,
	`live_url` varchar(300) NOT NULL,
	`tags` json NOT NULL,
	`thumbnail_public_id` varchar(255),
	`thumbnail_url` varchar(500),
	`thumbnail_width` int,
	`thumbnail_height` int,
	`thumbnail_alt_en` varchar(140),
	`thumbnail_alt_id` varchar(140),
	`sort_order` smallint NOT NULL DEFAULT 100,
	`featured` boolean NOT NULL DEFAULT false,
	`published` boolean NOT NULL DEFAULT false,
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `projects_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE INDEX `admin_sessions_expires_idx` ON `admin_sessions` (`expires_at`);--> statement-breakpoint
CREATE INDEX `login_attempts_ip_created_idx` ON `login_attempts` (`ip_hash`,`created_at`);--> statement-breakpoint
CREATE INDEX `projects_public_order_idx` ON `projects` (`published`,`sort_order`,`created_at`);