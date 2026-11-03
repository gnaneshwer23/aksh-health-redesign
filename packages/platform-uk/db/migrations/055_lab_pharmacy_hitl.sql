-- 055: Lab / pharmacy HITL drafts (Milestone E1 shared-run correlation).
-- Postgres-preferred read model for shared Neon sandboxes; file remains hermetic / fallback.
-- Simulation only — live:false · ehrWrite:false · no EPS / pathology adapters.
-- Apply on simulation / local-dev Neon only.

CREATE SCHEMA IF NOT EXISTS aksh;

CREATE TABLE IF NOT EXISTS aksh.lab_pharmacy_hitl_drafts (
  id TEXT NOT NULL,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  organisation_id TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('lab', 'pharmacy')),
  status TEXT NOT NULL CHECK (status IN (
    'staged', 'pending_review', 'accepted', 'edited', 'rejected'
  )),
  synthetic_patient_id TEXT NOT NULL,
  care_episode_id TEXT,
  case_id TEXT,
  draft JSONB NOT NULL,
  staged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synthetic BOOLEAN NOT NULL DEFAULT TRUE,
  ehr_write BOOLEAN NOT NULL DEFAULT FALSE,
  live BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (id, scope_key)
);

CREATE INDEX IF NOT EXISTS idx_lab_pharmacy_hitl_scope_updated
  ON aksh.lab_pharmacy_hitl_drafts (scope_key, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_lab_pharmacy_hitl_scope_kind_status
  ON aksh.lab_pharmacy_hitl_drafts (scope_key, kind, status);

CREATE INDEX IF NOT EXISTS idx_lab_pharmacy_hitl_care_episode
  ON aksh.lab_pharmacy_hitl_drafts (scope_key, care_episode_id)
  WHERE care_episode_id IS NOT NULL;
