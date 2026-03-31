-- Add duration_months and created_at to invite_codes
-- duration_months: 0 = eternal, 3 | 6 | 12 = fixed subscription period
ALTER TABLE invite_codes ADD COLUMN duration_months INTEGER NOT NULL DEFAULT 0;
ALTER TABLE invite_codes ADD COLUMN created_at INTEGER;
