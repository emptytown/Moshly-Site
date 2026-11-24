-- Billing: provider-neutral subscription state on the workspace's subscription row.
-- The plan always lives in the Moshly database; payment processors (Stripe today,
-- Apple in-app purchases later) only feed it through webhooks.
--
-- expires_at keeps its meaning: the date the current plan is paid (or granted) until.
-- For a Stripe subscription it is the end of the current billing period.

ALTER TABLE `subscriptions` ADD `billing_provider` text;          -- 'stripe' | 'apple' | NULL (free or invite code)
--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `billing_status` text;            -- active | trialing | past_due | canceled | incomplete | unpaid | paused
--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `billing_interval` text;          -- 'month' | 'year'
--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `cancel_at_period_end` integer DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `stripe_customer_id` text;
--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `stripe_subscription_id` text;
--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `trial_used_at` integer;
--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `billing_updated_at` integer;
--> statement-breakpoint
-- me.js already reads and writes app_changed_at, but the column was never created.
ALTER TABLE `subscriptions` ADD `app_changed_at` integer;
--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_stripe_customer_id_idx` ON `subscriptions` (`stripe_customer_id`);
--> statement-breakpoint
CREATE INDEX `subscriptions_stripe_subscription_id_idx` ON `subscriptions` (`stripe_subscription_id`);
--> statement-breakpoint
-- Processed webhook events, so a redelivered event is applied only once.
CREATE TABLE `billing_events` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`type` text NOT NULL,
	`created_at` integer NOT NULL
);
