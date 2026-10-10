-- 019: Own-organisation read policy evaluated on the row itself.
-- can_access_patient() looks the patient up, which cannot see a row being inserted by the same statement, so
-- INSERT ... RETURNING failed. Permissive policies are OR-ed: own-organisation rows are checked directly here,
-- cross-organisation and self access still go through can_access_patient().
DROP POLICY IF EXISTS patient_own_org_read ON aksh.network_patients;
CREATE POLICY patient_own_org_read ON aksh.network_patients FOR SELECT TO aksh_tenant
  USING (organisation_id = ANY (aksh.ctx_org_ids()));
