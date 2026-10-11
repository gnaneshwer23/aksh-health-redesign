-- 038: Fixes from the review of #12.

-- 1. org_public: members see kind and region; a patient sees only the name and the patient-facing locale.
CREATE OR REPLACE FUNCTION aksh.org_public(p_org TEXT)
RETURNS TABLE (id TEXT, name TEXT, kind TEXT, region TEXT, locale JSONB)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = aksh, pg_temp AS $$
  SELECT o.id, o.name,
         CASE WHEN o.id = ANY (aksh.ctx_org_ids()) THEN o.kind END,
         CASE WHEN o.id = ANY (aksh.ctx_org_ids()) THEN o.region END,
         jsonb_strip_nulls(jsonb_build_object(
           'timezone', o.locale->'timezone', 'language', o.locale->'language', 'glucoseUnit', o.locale->'glucoseUnit',
           'hba1cUnit', o.locale->'hba1cUnit', 'emergencyNumber', o.locale->'emergencyNumber',
           'urgentAdviceLine', o.locale->'urgentAdviceLine', 'crisisLine', o.locale->'crisisLine'))
  FROM aksh.organisations o
  WHERE o.id = p_org AND aksh.ctx_user() IS NOT NULL AND (
    o.id = ANY (aksh.ctx_org_ids())
    OR EXISTS (SELECT 1 FROM aksh.network_patients p WHERE p.organisation_id = o.id AND p.id = ANY (aksh.ctx_patient_ids()))
  );
$$;

-- 2. The time zone and glucose unit of a patient's organisation, for anyone allowed to see that patient (including a
--    consented care team in another organisation), so CGM times are read correctly. Nothing else about the organisation.
CREATE OR REPLACE FUNCTION aksh.patient_locale(p_patient TEXT)
RETURNS TABLE (timezone TEXT, glucose_unit TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = aksh, pg_temp AS $$
  SELECT o.locale->>'timezone', o.locale->>'glucoseUnit'
  FROM aksh.network_patients p JOIN aksh.organisations o ON o.id = p.organisation_id
  WHERE p.id = p_patient AND aksh.can_access_patient(p_patient);
$$;
REVOKE ALL ON FUNCTION aksh.patient_locale(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION aksh.patient_locale(TEXT) TO aksh_tenant;

-- 3. CGM provenance cannot be forged from a tenant session: an upload is 'patient' exactly when the uploader is that
--    patient's own account, and every reading belongs to an upload made by the same user for the same patient.
DROP POLICY IF EXISTS cgm_uploads_access ON aksh.cgm_uploads;
CREATE POLICY cgm_uploads_access ON aksh.cgm_uploads FOR ALL TO aksh_tenant
  USING (aksh.can_access_patient(patient_id))
  WITH CHECK (
    aksh.can_access_patient(patient_id) AND uploaded_by = current_setting('app.user_id', true)
    AND (uploader_kind = 'patient') = EXISTS (SELECT 1 FROM aksh.patient_accounts a WHERE a.patient_id = cgm_uploads.patient_id AND a.user_id = current_setting('app.user_id', true))
  );
DROP POLICY IF EXISTS cgm_readings_access ON aksh.cgm_readings;
CREATE POLICY cgm_readings_access ON aksh.cgm_readings FOR ALL TO aksh_tenant
  USING (aksh.can_access_patient(patient_id))
  WITH CHECK (
    aksh.can_access_patient(patient_id) AND upload_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM aksh.cgm_uploads u WHERE u.id = upload_id AND u.patient_id = cgm_readings.patient_id AND u.uploaded_by = current_setting('app.user_id', true))
  );
