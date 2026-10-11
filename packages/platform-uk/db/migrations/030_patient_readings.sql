-- 030: Patient readings on the server. Patients record glucose, blood pressure and weight from their own account;
-- readings reach the clinic record as patient_reported and unverified, and only count clinically once a clinician
-- verifies them. Self-registered patients without a clinic keep readings in a personal store until they link.

ALTER TABLE aksh.network_observations
  ADD COLUMN IF NOT EXISTS client_ref TEXT,              -- idempotency key from the device (offline retries)
  ADD COLUMN IF NOT EXISTS original_value NUMERIC,       -- as entered, before conversion to the stored unit
  ADD COLUMN IF NOT EXISTS original_unit TEXT,
  ADD COLUMN IF NOT EXISTS context TEXT,                 -- fasting, before_meal, after_meal, bedtime, other
  ADD COLUMN IF NOT EXISTS flag TEXT,                    -- very_low, low, high, very_high (computed on the server)
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'final',
  ADD COLUMN IF NOT EXISTS verified_by TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
DO $$ BEGIN
  ALTER TABLE aksh.network_observations ADD CONSTRAINT network_observations_status_check CHECK (status IN ('final', 'entered_in_error'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS network_observations_client_ref ON aksh.network_observations (patient_id, client_ref) WHERE client_ref IS NOT NULL;
CREATE INDEX IF NOT EXISTS network_observations_review ON aksh.network_observations (patient_id, recorded_at DESC)
  WHERE source IN ('patient_reported', 'device') AND NOT verified AND status = 'final';

-- Clinicians verify; patients may mark their own unverified reading as entered in error. Nothing else changes.
DROP POLICY IF EXISTS obs_update ON aksh.network_observations;
CREATE POLICY obs_update ON aksh.network_observations FOR UPDATE TO aksh_tenant
  USING (aksh.can_access_patient(patient_id)) WITH CHECK (aksh.can_access_patient(patient_id));
GRANT UPDATE (verified, verified_by, verified_at, status) ON aksh.network_observations TO aksh_tenant;

CREATE OR REPLACE FUNCTION aksh.guard_observation_write() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE own BOOLEAN;
BEGIN
  IF current_user <> 'aksh_tenant' THEN RETURN NEW; END IF;
  own := EXISTS (SELECT 1 FROM aksh.patient_accounts a WHERE a.patient_id = NEW.patient_id AND a.user_id = current_setting('app.user_id', true));
  IF TG_OP = 'INSERT' THEN
    IF NEW.source IN ('patient_reported', 'device') AND NEW.verified THEN
      RAISE EXCEPTION 'UNVERIFIED_ONLY: patient-reported and device readings start unverified';
    END IF;
    IF own AND NEW.source <> 'patient_reported' THEN
      RAISE EXCEPTION 'PATIENT_SOURCE: a patient can only add patient-reported readings';
    END IF;
    IF own AND NEW.recorded_by IS DISTINCT FROM current_setting('app.user_id', true) THEN
      RAISE EXCEPTION 'PATIENT_SOURCE: recorded_by must be the patient';
    END IF;
    RETURN NEW;
  END IF;
  -- UPDATE
  IF NEW.verified AND NOT OLD.verified THEN
    IF own THEN RAISE EXCEPTION 'SELF_VERIFY: a patient cannot verify their own reading'; END IF;
    IF NEW.verified_by IS DISTINCT FROM current_setting('app.user_id', true) THEN RAISE EXCEPTION 'VERIFIED_BY: must be the verifying user'; END IF;
  END IF;
  IF OLD.verified AND NOT NEW.verified THEN RAISE EXCEPTION 'VERIFIED_FINAL: verification cannot be undone'; END IF;
  IF NEW.status <> OLD.status THEN
    IF OLD.status = 'entered_in_error' THEN RAISE EXCEPTION 'STATUS_FINAL: entered-in-error cannot be reversed'; END IF;
    IF own AND OLD.verified THEN RAISE EXCEPTION 'VERIFIED_FINAL: ask your care team to correct a checked reading'; END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS network_observations_guard ON aksh.network_observations;
CREATE TRIGGER network_observations_guard BEFORE INSERT OR UPDATE ON aksh.network_observations
  FOR EACH ROW EXECUTE FUNCTION aksh.guard_observation_write();

-- Readings of self-registered patients not yet linked to a clinic. Only the owner sees them.
CREATE TABLE IF NOT EXISTS aksh.personal_readings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES aksh.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('glucose', 'systolic_bp', 'diastolic_bp', 'weight')),
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  original_value NUMERIC,
  original_unit TEXT,
  context TEXT,
  flag TEXT,
  observed_at TIMESTAMPTZ NOT NULL,
  client_ref TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'final' CHECK (status IN ('final', 'entered_in_error')),
  shared_to_patient_id TEXT,          -- set when the patient chose to share it with their clinic after linking
  shared_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, client_ref)
);
CREATE INDEX IF NOT EXISTS personal_readings_user ON aksh.personal_readings (user_id, observed_at DESC);
ALTER TABLE aksh.personal_readings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS personal_readings_own ON aksh.personal_readings;
CREATE POLICY personal_readings_own ON aksh.personal_readings FOR ALL TO aksh_tenant
  USING (user_id = current_setting('app.user_id', true)) WITH CHECK (user_id = current_setting('app.user_id', true));
GRANT SELECT, INSERT ON aksh.personal_readings TO aksh_tenant;
GRANT UPDATE (status, shared_to_patient_id, shared_at) ON aksh.personal_readings TO aksh_tenant;
