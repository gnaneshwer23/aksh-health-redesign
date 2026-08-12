-- E2E synthetic batch tracking (Stage 2 platform validation).
-- All rows are synthetic · source AKSH_E2E_TEST · never production clinical data.
CREATE SCHEMA IF NOT EXISTS aksh;

CREATE TABLE IF NOT EXISTS aksh.e2e_batches (
  batch_id TEXT PRIMARY KEY,
  seed INTEGER NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL DEFAULT 'AKSH_E2E_TEST',
  patient_count INTEGER NOT NULL DEFAULT 0,
  user_count INTEGER NOT NULL DEFAULT 0,
  scenario_distribution JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  cleaned_up_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_e2e_batches_generated_at
  ON aksh.e2e_batches (generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_e2e_batches_active
  ON aksh.e2e_batches (batch_id)
  WHERE cleaned_up_at IS NULL;
