CREATE INDEX `invite_codes_workspace_id_idx` ON `invite_codes` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `reset_token_idx` ON `users` (`reset_token`);