-- Phase 9: real auth users and profiles for NextAuth credentials flow.
-- Run: psql "$DATABASE_URL" -f db/migrations/002_users_profiles.sql

CREATE SCHEMA IF NOT EXISTS aksh;

CREATE TABLE IF NOT EXISTS aksh.users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON aksh.users (email);

CREATE TABLE IF NOT EXISTS aksh.profiles (
  user_id TEXT PRIMARY KEY REFERENCES aksh.users (id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'gp',
  full_name TEXT,
  onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
  practice_ods TEXT,
  preferences JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON aksh.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON aksh.profiles (onboarding_complete);
