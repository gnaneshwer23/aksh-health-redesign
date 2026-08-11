-- Patient State foundation (C1 — docs/PHASED_BUILD_PLAN_C.md, implements
-- docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md P0-1). Append-only fact store.
-- No UPDATE/DELETE in application paths — a fact is superseded by writing a
-- new row and stamping `superseded_by` on the old one, never overwritten.
CREATE SCHEMA IF NOT EXISTS aksh;

CREATE TABLE IF NOT EXISTS aksh.patient_state_facts (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  fact_type TEXT NOT NULL,
  value JSONB NOT NULL,
  source_system TEXT NOT NULL,
  source_reference TEXT,
  confidence REAL NOT NULL DEFAULT 1.0,
  consent_scope_id TEXT,
  effective_at TIMESTAMPTZ NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  superseded_by TEXT REFERENCES aksh.patient_state_facts (id)
);

CREATE INDEX IF NOT EXISTS idx_patient_state_facts_patient_id
  ON aksh.patient_state_facts (patient_id);

CREATE INDEX IF NOT EXISTS idx_patient_state_facts_patient_fact_type
  ON aksh.patient_state_facts (patient_id, fact_type, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_patient_state_facts_current
  ON aksh.patient_state_facts (patient_id, fact_type)
  WHERE superseded_by IS NULL;
