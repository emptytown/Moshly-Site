CREATE TABLE `invite_codes` (
	`code` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`plan` text NOT NULL,
	`max_uses` integer DEFAULT 1,
	`uses_count` integer DEFAULT 0,
	`expires_at` integer,
	`note` text,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`job_title` text,
	`organization` text,
	`bio` text,
	`skills` text,
	`location` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`workspace_id` text PRIMARY KEY NOT NULL,
	`plan` text DEFAULT 'free',
	`pdf_exports_limit` integer DEFAULT 1,
	`pdf_exports_used` integer DEFAULT 0,
	`ai_credits_limit` integer DEFAULT 100,
	`ai_credits_used` integer DEFAULT 0,
	`expires_at` integer,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text,
	`role` text DEFAULT 'user',
	`avatar_url` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workspaces_slug_unique` ON `workspaces` (`slug`);