-- 054: Enforce care_plan_records / follow-up / decision org isolation.
-- Additive only. Apply on simulation / local-dev / throwaway Neon CI branches.
-- Never point agent workflows at production Neon / production main.
--
-- 043's soft policy allowed `organisation_id IS NULL` to every aksh_tenant context,
-- so cross-org "deny" only held for stamped rows and empty org context still saw
-- legacy NULL rows. Shared-DB HCP prep needs fail-closed like review_cases (023):
-- require a non-empty ctx_org_ids() and exact organisation_id match.

CREATE SCHEMA IF NOT EXISTS aksh;

DROP POLICY IF EXISTS care_plan_records_org ON aksh.care_plan_records;
CREATE POLICY care_plan_records_org ON aksh.care_plan_records
  FOR ALL TO aksh_tenant
  USING (
    cardinality(aksh.ctx_org_ids()) > 0
    AND organisation_id IS NOT NULL
    AND organisation_id = ANY (aksh.ctx_org_ids())
  )
  WITH CHECK (
    cardinality(aksh.ctx_org_ids()) > 0
    AND organisation_id IS NOT NULL
    AND organisation_id = ANY (aksh.ctx_org_ids())
  );

DROP POLICY IF EXISTS care_follow_up_org ON aksh.care_follow_up_tasks;
CREATE POLICY care_follow_up_org ON aksh.care_follow_up_tasks
  FOR ALL TO aksh_tenant
  USING (
    cardinality(aksh.ctx_org_ids()) > 0
    AND organisation_id IS NOT NULL
    AND organisation_id = ANY (aksh.ctx_org_ids())
  )
  WITH CHECK (
    cardinality(aksh.ctx_org_ids()) > 0
    AND organisation_id IS NOT NULL
    AND organisation_id = ANY (aksh.ctx_org_ids())
  );

DROP POLICY IF EXISTS care_plan_decisions_via_plan ON aksh.care_plan_decisions;
CREATE POLICY care_plan_decisions_via_plan ON aksh.care_plan_decisions
  FOR ALL TO aksh_tenant
  USING (
    EXISTS (
      SELECT 1 FROM aksh.care_plan_records p
      WHERE p.id = plan_id
        AND cardinality(aksh.ctx_org_ids()) > 0
        AND p.organisation_id IS NOT NULL
        AND p.organisation_id = ANY (aksh.ctx_org_ids())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM aksh.care_plan_records p
      WHERE p.id = plan_id
        AND cardinality(aksh.ctx_org_ids()) > 0
        AND p.organisation_id IS NOT NULL
        AND p.organisation_id = ANY (aksh.ctx_org_ids())
    )
  );

COMMENT ON POLICY care_plan_records_org ON aksh.care_plan_records IS
  '054 enforced org RLS — fail-closed; stamped organisation_id must match aksh.ctx_org_ids()';
