-- Phase B: review case persistence with practice-level tenancy scaffold.
-- Run against local Postgres (e.g. docker-compose postgres on :5432).
-- Example: psql "$DATABASE_URL" -f db/migrations/001_review_cases.sql

CREATE SCHEMA IF NOT EXISTS aksh;

CREATE TABLE IF NOT EXISTS aksh.review_cases (
  id TEXT NOT NULL,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  practice_id TEXT NOT NULL DEFAULT 'practice-demo',
  user_id TEXT NOT NULL DEFAULT 'anonymous',
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, scope_key, practice_id)
);

CREATE INDEX IF NOT EXISTS idx_review_cases_scope_practice
  ON aksh.review_cases (scope_key, practice_id);

CREATE INDEX IF NOT EXISTS idx_review_cases_user
  ON aksh.review_cases (user_id);

-- RLS scaffold: filter rows by session practice_id when set.
ALTER TABLE aksh.review_cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS review_cases_tenant_isolation ON aksh.review_cases;

CREATE POLICY review_cases_tenant_isolation ON aksh.review_cases
  FOR ALL
  USING (
    current_setting('app.practice_id', true) IS NULL
    OR current_setting('app.practice_id', true) = ''
    OR practice_id = current_setting('app.practice_id', true)
  );

CREATE TABLE IF NOT EXISTS aksh.onboarding_progress (
  user_scope TEXT PRIMARY KEY,
  practice_id TEXT NOT NULL DEFAULT 'practice-demo',
  role TEXT NOT NULL,
  step INTEGER NOT NULL DEFAULT 0,
  profile JSONB NOT NULL DEFAULT '{}',
  compliance_ack JSONB NOT NULL DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
