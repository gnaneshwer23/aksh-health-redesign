-- D1-a: BRIDGE FHIR-in-Neon staging (no Medplum OAuth required).
-- Stores clinician-accepted FHIR Bundles as preliminary/staging only.
-- liveEmis always false — never a live EMIS / Partner write.

CREATE SCHEMA IF NOT EXISTS aksh;

CREATE TABLE IF NOT EXISTS aksh.fhir_staging_bundles (
  id TEXT PRIMARY KEY,
  staged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  case_id TEXT,
  practice_id TEXT,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  accepted_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'preliminary'
    CHECK (status IN ('preliminary', 'staging', 'superseded')),
  synthetic_only BOOLEAN NOT NULL DEFAULT TRUE,
  live_emis BOOLEAN NOT NULL DEFAULT FALSE,
  medplum_required BOOLEAN NOT NULL DEFAULT FALSE,
  bundle_summary TEXT NOT NULL,
  bundle JSONB NOT NULL,
  note TEXT NOT NULL DEFAULT 'BRIDGE in-app FHIR staging · not live EMIS · liveEmis:false'
);

CREATE INDEX IF NOT EXISTS idx_fhir_staging_staged_at
  ON aksh.fhir_staging_bundles (staged_at DESC);

CREATE INDEX IF NOT EXISTS idx_fhir_staging_case_id
  ON aksh.fhir_staging_bundles (case_id);

CREATE INDEX IF NOT EXISTS idx_fhir_staging_scope
  ON aksh.fhir_staging_bundles (scope_key);

CREATE INDEX IF NOT EXISTS idx_fhir_staging_practice
  ON aksh.fhir_staging_bundles (practice_id);
