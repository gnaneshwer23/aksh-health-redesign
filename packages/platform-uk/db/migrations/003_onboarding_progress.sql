-- Phase 10: user-scoped onboarding progress synced from the client store.
-- Replaces the legacy user_scope / practice_id table from 001_review_cases.sql.
-- Run: psql "$DATABASE_URL" -f db/migrations/003_onboarding_progress.sql

CREATE SCHEMA IF NOT EXISTS aksh;

DROP TABLE IF EXISTS aksh.onboarding_progress;

CREATE TABLE IF NOT EXISTS aksh.onboarding_progress (
  user_id TEXT PRIMARY KEY REFERENCES aksh.users(id) ON DELETE CASCADE,
  role TEXT,
  current_step INTEGER NOT NULL DEFAULT 0,
  total_steps INTEGER,
  identity JSONB DEFAULT '{}',
  organisation JSONB DEFAULT '{}',
  preferences JSONB DEFAULT '{}',
  consents JSONB DEFAULT '{}',
  tutorial_screen INTEGER DEFAULT 0,
  completed_steps INTEGER[] DEFAULT '{}',
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_progress_saved_at
  ON aksh.onboarding_progress (saved_at DESC);
