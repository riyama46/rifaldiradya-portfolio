-- Explicit charset (SDD section 3): utf8mb4_unicode_ci regardless of the database default.
CREATE TABLE `image_variants` (
	`image_id` varchar(26) NOT NULL,
	`width` smallint unsigned NOT NULL,
	`height` smallint unsigned NOT NULL,
	`bytes` mediumblob NOT NULL,
	CONSTRAINT `image_variants_image_id_width_pk` PRIMARY KEY(`image_id`,`width`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `images` (
	`id` varchar(26) NOT NULL,
	`format` varchar(4) NOT NULL,
	`width` smallint unsigned NOT NULL,
	`height` smallint unsigned NOT NULL,
	`created_at` datetime(3) NOT NULL,
	CONSTRAINT `images_id` PRIMARY KEY(`id`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `image_variants` ADD CONSTRAINT `image_variants_image_id_images_id_fk` FOREIGN KEY (`image_id`) REFERENCES `images`(`id`) ON DELETE cascade ON UPDATE no action;