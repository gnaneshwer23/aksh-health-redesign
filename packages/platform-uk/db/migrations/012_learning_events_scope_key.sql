-- OQ-TEN-1: learning_events must be scoped per caller (e2e run / demo cohort / tenant)
-- like every other aksh table, not readable cross-scope. Without this, listPostgres()
-- returned ALL rows ever written to the shared Postgres instance regardless of the
-- caller's scopeKey, causing cross-test-run pollution (e.g. a fresh scope's care-action
-- count silently including rows from unrelated CI runs).
ALTER TABLE aksh.learning_events
  ADD COLUMN IF NOT EXISTS scope_key TEXT NOT NULL DEFAULT 'shared';

CREATE INDEX IF NOT EXISTS idx_learning_events_scope_key
  ON aksh.learning_events (scope_key);
