-- T-18b (DECISIONS): profile photo setting + project positions 1…n without duplicates.
-- Explicit charset (SDD section 3): utf8mb4_unicode_ci regardless of the database default.
CREATE TABLE `site_settings` (
	`key` varchar(50) NOT NULL,
	`value` varchar(255),
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `site_settings_key` PRIMARY KEY(`key`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `projects` MODIFY COLUMN `sort_order` smallint NOT NULL DEFAULT 1;
--> statement-breakpoint
-- Renumber existing projects in their current order (sort_order asc, newest first) to 1…n.
UPDATE `projects` AS `p`
JOIN (
	SELECT `id`, ROW_NUMBER() OVER (ORDER BY `sort_order` ASC, `created_at` DESC) AS `position`
	FROM `projects`
) AS `ranked` ON `ranked`.`id` = `p`.`id`
SET `p`.`sort_order` = `ranked`.`position`;
