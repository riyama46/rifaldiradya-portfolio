-- v2.0.0 showcase (CHANGE v2.0.0, Delta SDD section 3). Adds columns only, except that live_url
-- becomes NULL-able (D-21): rolling back to v1 code after a project without a URL exists needs the
-- pre-release database backup. One ALTER so the table is rebuilt once.
-- Explicit charset (SDD section 3): utf8mb4_unicode_ci regardless of the database default.
-- `featured` stays in place: -- deprecated v2.0.0, not read (D-22); show_on_home replaces it.
ALTER TABLE `projects`
	MODIFY COLUMN `live_url` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
	ADD `group` varchar(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'web' NOT NULL,
	ADD `meta_en` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
	ADD `meta_id` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
	ADD `side_en` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
	ADD `side_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
	ADD `case_is_en` varchar(220) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
	ADD `case_is_id` varchar(220) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
	ADD `case_did_en` json,
	ADD `case_did_id` json,
	ADD `status_en` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
	ADD `status_id` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
	ADD `case_action` varchar(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'site' NOT NULL,
	ADD `visual_type` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'screenshot' NOT NULL,
	ADD `card_number` varchar(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
	ADD `card_caption_en` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
	ADD `card_caption_id` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
	ADD `show_on_home` boolean DEFAULT false NOT NULL;
--> statement-breakpoint
CREATE INDEX `projects_home_order_idx` ON `projects` (`published`,`show_on_home`,`sort_order`);
--> statement-breakpoint
-- Starting value only (Pal tidies it in the admin): published v1 hero projects become Selected work.
UPDATE `projects` SET `show_on_home` = `featured` WHERE `published` = 1;
