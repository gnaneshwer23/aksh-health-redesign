-- 031: A linked patient can read their own organisation's row (name, locale: emergency number, units).
-- Without this, row-level security hid it and patients saw no clinic name or emergency number.
DROP POLICY IF EXISTS org_patient_read ON aksh.organisations;
CREATE POLICY org_patient_read ON aksh.organisations FOR SELECT TO aksh_tenant
  USING (id IN (SELECT p.organisation_id FROM aksh.network_patients p WHERE p.id = ANY (aksh.ctx_patient_ids())));
