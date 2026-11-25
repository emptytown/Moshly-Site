-- Monthly quota reset: the month (UTC) the usage counters belong to.
-- NULL means "never reset"; the next read starts the current period.
ALTER TABLE subscriptions ADD COLUMN usage_period_start integer;
