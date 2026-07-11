-- Phase 12: persist ICS pilot interest applications from the public marketing form.
-- Run: psql "$DATABASE_URL" -f db/migrations/004_pilot_applications.sql

CREATE SCHEMA IF NOT EXISTS aksh;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS aksh.pilot_applications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_type TEXT NOT NULL,
  org_name TEXT NOT NULL,
  ods_code TEXT,
  region TEXT,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  ehr_systems TEXT[] DEFAULT '{}',
  list_size TEXT,
  it_contact TEXT,
  commitments TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pilot_applications_created_at
  ON aksh.pilot_applications (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pilot_applications_status
  ON aksh.pilot_applications (status);
