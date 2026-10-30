-- 049: INT-08 / INT-10 — organisation FK proofs + clinical persona attribution
-- for connected diabetes module stores.
-- Additive only. Apply on simulation / local-dev Neon only.
-- Never point agent workflows at production Neon / production main.

CREATE SCHEMA IF NOT EXISTS aksh;

-- ---------------------------------------------------------------- persona on journey HITL decisions
ALTER TABLE aksh.care_plan_records
  ADD COLUMN IF NOT EXISTS decided_by_persona TEXT;

ALTER TABLE aksh.care_plan_decisions
  ADD COLUMN IF NOT EXISTS actor_persona TEXT;

-- ---------------------------------------------------------------- org indexes (defence-in-depth for RLS proofs)
CREATE INDEX IF NOT EXISTS idx_care_plan_records_org
  ON aksh.care_plan_records (organisation_id)
  WHERE organisation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_care_follow_up_org
  ON aksh.care_follow_up_tasks (organisation_id)
  WHERE organisation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ccare_followups_org
  ON aksh.ccare_follow_up_items (organisation_id)
  WHERE organisation_id IS NOT NULL;

-- Comment for operators: RLS policies already allow
--   organisation_id IS NULL OR organisation_id = ANY (aksh.ctx_org_ids())
-- Simulation writes now stamp organisation_id = practice-demo (or tenant practiceId)
-- so withOrgContext / aksh_tenant can prove cross-org isolation without LIVE_ORGANISATIONS.
COMMENT ON COLUMN aksh.care_plan_records.organisation_id IS
  'INT-08 simulation/org FK; NULL = legacy unscoped synthetic row; RLS via aksh.ctx_org_ids()';

COMMENT ON COLUMN aksh.care_plan_records.decided_by_persona IS
  'INT-10 clinical persona who signed Accept/Edit/Reject (gp | nurse | clinical-pharmacist)';

COMMENT ON COLUMN aksh.care_plan_decisions.actor_persona IS
  'INT-10 clinical persona on append-only decision row';
