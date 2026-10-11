-- 023: Enforce review_cases tenant isolation.
-- 001's policy was fail-open (allowed every row when app.practice_id was unset) and never applied, because the
-- application connects as the owner role, which bypasses RLS. Requests now run as aksh_tenant (see
-- withPracticeContext) and the policy requires a matching practice.
DROP POLICY IF EXISTS review_cases_tenant_isolation ON aksh.review_cases;
CREATE POLICY review_cases_tenant_isolation ON aksh.review_cases
  FOR ALL TO aksh_tenant
  USING (NULLIF(current_setting('app.practice_id', true), '') IS NOT NULL AND practice_id = current_setting('app.practice_id', true))
  WITH CHECK (NULLIF(current_setting('app.practice_id', true), '') IS NOT NULL AND practice_id = current_setting('app.practice_id', true));
GRANT SELECT, INSERT, UPDATE, DELETE ON aksh.review_cases TO aksh_tenant;
