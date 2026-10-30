-- 051: INT-03 / INT-04a follow-through — care-plan + follow-up canonical link columns
-- Additive only. Apply on simulation / local-dev Neon only.
-- Never point agent workflows at production Neon / production main.
--
-- Physical SoT:
--   care plans  → aksh.care_plan_records
--   follow-ups  → aksh.care_follow_up_tasks
-- Satellites retained (no drops):
--   medcare_care_plans.canonical_plan_id → links template draft to SoT row
--   ccare_follow_up_items remain ops projection (bridge dual-write; source_ref_id)

CREATE SCHEMA IF NOT EXISTS aksh;

ALTER TABLE aksh.care_plan_records
  ADD COLUMN IF NOT EXISTS entry_surface TEXT
    CHECK (
      entry_surface IS NULL
      OR entry_surface IN ('journey', 'medcare', 'shared')
    );

ALTER TABLE aksh.care_plan_records
  ADD COLUMN IF NOT EXISTS medcare_plan_id TEXT;

CREATE INDEX IF NOT EXISTS idx_care_plan_entry_surface
  ON aksh.care_plan_records (scope_key, patient_id, entry_surface)
  WHERE entry_surface IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_care_plan_medcare_link
  ON aksh.care_plan_records (scope_key, medcare_plan_id)
  WHERE medcare_plan_id IS NOT NULL;

COMMENT ON COLUMN aksh.care_plan_records.entry_surface IS
  'INT-03 collapse — which surface drafted the canonical plan (journey | medcare | shared); NULL = legacy';
COMMENT ON COLUMN aksh.care_plan_records.medcare_plan_id IS
  'INT-03 collapse — optional link to medcare_care_plans satellite row';

ALTER TABLE aksh.medcare_care_plans
  ADD COLUMN IF NOT EXISTS canonical_plan_id TEXT;

CREATE INDEX IF NOT EXISTS idx_medcare_plans_canonical
  ON aksh.medcare_care_plans (scope_key, canonical_plan_id)
  WHERE canonical_plan_id IS NOT NULL;

COMMENT ON COLUMN aksh.medcare_care_plans.canonical_plan_id IS
  'INT-03 collapse — FK-ish text to care_plan_records.id (canonical HITL SoT); NULL = unmirrored legacy';

ALTER TABLE aksh.care_follow_up_tasks
  ADD COLUMN IF NOT EXISTS entry_surface TEXT
    CHECK (
      entry_surface IS NULL
      OR entry_surface IN ('journey', 'continuous_care', 'shared')
    );

CREATE INDEX IF NOT EXISTS idx_care_follow_up_entry_surface
  ON aksh.care_follow_up_tasks (scope_key, patient_id, entry_surface)
  WHERE entry_surface IS NOT NULL;

COMMENT ON COLUMN aksh.care_follow_up_tasks.entry_surface IS
  'INT-04a collapse — which surface created the canonical follow-up; ccare rows are ops projection';
