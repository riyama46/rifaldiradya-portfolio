-- v2.2.0 (D-42): optional demo video and code repository links. Adds columns only, so v2.1.0 code
-- keeps working after a rollback (it never reads them). One ALTER so the table is rebuilt once.
-- Explicit charset (SDD section 3): utf8mb4_unicode_ci regardless of the database default.
ALTER TABLE `projects`
	ADD `demo_url` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
	ADD `repo_url` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
