-- 036: Fixes from the review of #10.

-- 1. Patients saw every column of their clinic's row (031). Replace that policy with a function returning only what a
--    patient needs: name and the patient-facing locale fields. Members still read their organisations through RLS.
DROP POLICY IF EXISTS org_patient_read ON aksh.organisations;
CREATE OR REPLACE FUNCTION aksh.org_public(p_org TEXT)
RETURNS TABLE (id TEXT, name TEXT, kind TEXT, region TEXT, locale JSONB)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = aksh, pg_temp AS $$
  SELECT o.id, o.name, o.kind, o.region,
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
REVOKE ALL ON FUNCTION aksh.org_public(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION aksh.org_public(TEXT) TO aksh_tenant;

-- 2. A clinician's review of a patient's own CGM upload. Until reviewed, those readings stay out of the worklist and out
--    of summaries marked verified. Append-only.
CREATE TABLE IF NOT EXISTS aksh.cgm_upload_reviews (
  upload_id TEXT PRIMARY KEY REFERENCES aksh.cgm_uploads(id) ON DELETE CASCADE,
  reviewed_by TEXT NOT NULL,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS cgm_upload_reviews_append_only ON aksh.cgm_upload_reviews;
CREATE TRIGGER cgm_upload_reviews_append_only BEFORE UPDATE OR DELETE ON aksh.cgm_upload_reviews
  FOR EACH ROW EXECUTE FUNCTION aksh.reject_mutation_unless_purge();
ALTER TABLE aksh.cgm_upload_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cgm_upload_reviews_access ON aksh.cgm_upload_reviews;
CREATE POLICY cgm_upload_reviews_access ON aksh.cgm_upload_reviews FOR ALL TO aksh_tenant
  USING (EXISTS (SELECT 1 FROM aksh.cgm_uploads u WHERE u.id = upload_id AND aksh.can_access_patient(u.patient_id)))
  WITH CHECK (reviewed_by = current_setting('app.user_id', true)
    AND EXISTS (SELECT 1 FROM aksh.cgm_uploads u WHERE u.id = upload_id AND u.uploader_kind = 'patient' AND aksh.can_access_patient(u.patient_id)
      AND NOT EXISTS (SELECT 1 FROM aksh.patient_accounts a WHERE a.patient_id = u.patient_id AND a.user_id = current_setting('app.user_id', true))));
GRANT SELECT, INSERT ON aksh.cgm_upload_reviews TO aksh_tenant;

-- Readings that count clinically: from clinic uploads and device feeds, or from a patient upload a clinician reviewed.
CREATE OR REPLACE VIEW aksh.cgm_trusted_readings WITH (security_invoker = true) AS
  SELECT r.* FROM aksh.cgm_readings r
  LEFT JOIN aksh.cgm_uploads u ON u.id = r.upload_id
  WHERE u.id IS NULL OR u.uploader_kind <> 'patient' OR EXISTS (SELECT 1 FROM aksh.cgm_upload_reviews v WHERE v.upload_id = u.id);
GRANT SELECT ON aksh.cgm_trusted_readings TO aksh_tenant;

-- 3. Deleting an upload (purge only) removes its readings instead of updating them (the append-only trigger rejects
--    the SET NULL update).
ALTER TABLE aksh.cgm_readings DROP CONSTRAINT IF EXISTS cgm_readings_upload_id_fkey;
ALTER TABLE aksh.cgm_readings ADD CONSTRAINT cgm_readings_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES aksh.cgm_uploads(id) ON DELETE CASCADE;
