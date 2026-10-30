-- 050: INT-04 — medication reconciliation entry-surface provenance
-- Additive only. Apply on simulation / local-dev Neon only.
-- Never point agent workflows at production Neon / production main.
--
-- Physical store was already single-table (medication_reconciliation_runs).
-- This column tags which UI/API surface started the run so dual entry points
-- share one write path without destructive merge / drops.

CREATE SCHEMA IF NOT EXISTS aksh;

ALTER TABLE aksh.medication_reconciliation_runs
  ADD COLUMN IF NOT EXISTS entry_surface TEXT
    CHECK (
      entry_surface IS NULL
      OR entry_surface IN ('patient360', 'medcare', 'shared')
    );

CREATE INDEX IF NOT EXISTS idx_med_recon_entry_surface
  ON aksh.medication_reconciliation_runs (scope_key, patient_id, entry_surface)
  WHERE entry_surface IS NOT NULL;

COMMENT ON COLUMN aksh.medication_reconciliation_runs.entry_surface IS
  'INT-04 which surface started the run (patient360 | medcare | shared); NULL = legacy pre-facade row';
