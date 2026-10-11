-- 032: Continuous glucose monitoring (CGM). Readings arrive as exports (Dexcom Clarity, LibreView, generic CSV) or,
-- later, through the schedule/device connector. Metrics (time in range, GMI, CV, wear) are computed from these rows
-- and summarised into network_observations so existing clinical views keep working.

CREATE TABLE IF NOT EXISTS aksh.cgm_uploads (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  patient_id TEXT NOT NULL REFERENCES aksh.network_patients(id) ON DELETE CASCADE,
  uploaded_by TEXT NOT NULL,
  uploader_kind TEXT NOT NULL CHECK (uploader_kind IN ('patient', 'staff')),
  format TEXT NOT NULL,                     -- dexcom_clarity, libreview, generic
  filename TEXT,
  timezone TEXT NOT NULL,                   -- used to read local timestamps in the export
  rows_read INTEGER NOT NULL,
  rows_accepted INTEGER NOT NULL,
  rows_duplicate INTEGER NOT NULL,
  rows_rejected INTEGER NOT NULL,
  first_at TIMESTAMPTZ,
  last_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS cgm_uploads_patient ON aksh.cgm_uploads (patient_id, created_at DESC);

CREATE TABLE IF NOT EXISTS aksh.cgm_readings (
  patient_id TEXT NOT NULL REFERENCES aksh.network_patients(id) ON DELETE CASCADE,
  at TIMESTAMPTZ NOT NULL,
  mmol NUMERIC(4, 1) NOT NULL CHECK (mmol >= 1 AND mmol <= 40),
  censored TEXT CHECK (censored IN ('below_range', 'above_range')),   -- device showed Low / High
  upload_id TEXT REFERENCES aksh.cgm_uploads(id) ON DELETE SET NULL,
  PRIMARY KEY (patient_id, at)
);

-- Rows from uploads are facts as exported: no updates. Deletion only with the purge flag (test cleanup).
DROP TRIGGER IF EXISTS cgm_readings_append_only ON aksh.cgm_readings;
CREATE TRIGGER cgm_readings_append_only BEFORE UPDATE OR DELETE ON aksh.cgm_readings
  FOR EACH ROW EXECUTE FUNCTION aksh.reject_mutation_unless_purge();
DROP TRIGGER IF EXISTS cgm_uploads_append_only ON aksh.cgm_uploads;
CREATE TRIGGER cgm_uploads_append_only BEFORE UPDATE OR DELETE ON aksh.cgm_uploads
  FOR EACH ROW EXECUTE FUNCTION aksh.reject_mutation_unless_purge();

ALTER TABLE aksh.cgm_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.cgm_readings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cgm_uploads_access ON aksh.cgm_uploads;
CREATE POLICY cgm_uploads_access ON aksh.cgm_uploads FOR ALL TO aksh_tenant
  USING (aksh.can_access_patient(patient_id)) WITH CHECK (aksh.can_access_patient(patient_id) AND uploaded_by = current_setting('app.user_id', true));
DROP POLICY IF EXISTS cgm_readings_access ON aksh.cgm_readings;
CREATE POLICY cgm_readings_access ON aksh.cgm_readings FOR ALL TO aksh_tenant
  USING (aksh.can_access_patient(patient_id)) WITH CHECK (aksh.can_access_patient(patient_id));
GRANT SELECT, INSERT ON aksh.cgm_uploads, aksh.cgm_readings TO aksh_tenant;

-- CGM summaries in network_observations need more kinds.
ALTER TABLE aksh.network_observations DROP CONSTRAINT IF EXISTS network_observations_kind_check;
ALTER TABLE aksh.network_observations ADD CONSTRAINT network_observations_kind_check CHECK (kind IN (
  'hba1c', 'glucose', 'systolic_bp', 'diastolic_bp', 'weight', 'bmi', 'egfr', 'acr', 'ldl',
  'cgm_time_in_range', 'cgm_time_below_range', 'hypo_event',
  'cgm_time_below_54', 'cgm_time_above_range', 'cgm_time_above_250', 'cgm_mean_glucose', 'cgm_gmi', 'cgm_cv', 'cgm_wear'
));
