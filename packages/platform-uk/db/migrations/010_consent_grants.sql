-- Layer 2 (build instructions, adapted to Neon): durable purpose-bound consent grants.
-- Mirrors the file-based consent-grant-repository store; Postgres is the durable copy.
-- Rows are append-only apart from revocation fields (status/revoked_at/revoked_by).
-- Run: psql "$DATABASE_URL" -f db/migrations/010_consent_grants.sql

CREATE SCHEMA IF NOT EXISTS aksh;

CREATE TABLE IF NOT EXISTS aksh.consent_grants (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  patient_id TEXT NOT NULL,
  purpose_code TEXT NOT NULL,
  modalities TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  granted_by TEXT NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  revoked_by TEXT,
  notes TEXT,
  ehr_write BOOLEAN NOT NULL DEFAULT FALSE,
  hitl_required BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_consent_grants_patient ON aksh.consent_grants (patient_id);
CREATE INDEX IF NOT EXISTS idx_consent_grants_scope ON aksh.consent_grants (scope_key);
CREATE INDEX IF NOT EXISTS idx_consent_grants_status ON aksh.consent_grants (status);
