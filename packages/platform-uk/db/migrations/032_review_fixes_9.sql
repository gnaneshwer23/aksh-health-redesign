-- 032: Fixes from the review of #9.

-- 1. Device data counts clinically only when verified, like patient-reported data. Device rows written so far came from
--    staff imports, the sandbox and the simulation (never from patients, who use patient_reported): mark them verified.
UPDATE aksh.network_observations SET verified = TRUE, verified_at = COALESCE(verified_at, recorded_at)
 WHERE source = 'device' AND NOT verified;

-- 2. Observation guard: patients add only unverified patient-reported readings; staff and connectors may add verified
--    device data; a verification is final in every field; only the patient withdraws their own unchecked reading.
CREATE OR REPLACE FUNCTION aksh.guard_observation_write() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE own BOOLEAN;
BEGIN
  IF current_user <> 'aksh_tenant' THEN RETURN NEW; END IF;
  own := EXISTS (SELECT 1 FROM aksh.patient_accounts a WHERE a.patient_id = NEW.patient_id AND a.user_id = current_setting('app.user_id', true));
  IF TG_OP = 'INSERT' THEN
    IF NEW.source = 'patient_reported' AND NEW.verified THEN
      RAISE EXCEPTION 'UNVERIFIED_ONLY: patient-reported readings start unverified';
    END IF;
    IF own AND (NEW.source <> 'patient_reported' OR NEW.verified) THEN
      RAISE EXCEPTION 'PATIENT_SOURCE: a patient can only add unverified patient-reported readings';
    END IF;
    IF own AND NEW.recorded_by IS DISTINCT FROM current_setting('app.user_id', true) THEN
      RAISE EXCEPTION 'PATIENT_SOURCE: recorded_by must be the patient';
    END IF;
    RETURN NEW;
  END IF;
  IF OLD.verified AND (NOT NEW.verified OR NEW.verified_by IS DISTINCT FROM OLD.verified_by OR NEW.verified_at IS DISTINCT FROM OLD.verified_at) THEN
    RAISE EXCEPTION 'VERIFIED_FINAL: verification cannot be changed';
  END IF;
  IF NEW.verified AND NOT OLD.verified THEN
    IF own THEN RAISE EXCEPTION 'SELF_VERIFY: a patient cannot verify their own reading'; END IF;
    IF NEW.verified_by IS DISTINCT FROM current_setting('app.user_id', true) THEN RAISE EXCEPTION 'VERIFIED_BY: must be the verifying user'; END IF;
  END IF;
  IF NEW.status <> OLD.status THEN
    IF OLD.status = 'entered_in_error' THEN RAISE EXCEPTION 'STATUS_FINAL: entered-in-error cannot be reversed'; END IF;
    IF NOT own OR OLD.verified OR OLD.source <> 'patient_reported' THEN
      RAISE EXCEPTION 'STATUS_OWNER: only the patient can withdraw their own unchecked reading';
    END IF;
  END IF;
  RETURN NEW;
END $$;

-- 3. The status-lock helper (028) answered for any organisation id; it now only answers for the caller's organisations.
CREATE OR REPLACE FUNCTION aksh.lock_org_status(p_org TEXT) RETURNS TEXT
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = aksh, pg_temp AS $$
  SELECT status FROM aksh.organisations WHERE id = p_org AND p_org = ANY (aksh.ctx_org_ids()) FOR SHARE;
$$;

-- 4. Registration status follows only checks recorded under the member's own organisation.
CREATE OR REPLACE FUNCTION aksh.guard_registration_status() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE latest TEXT;
BEGIN
  IF current_user <> 'aksh_tenant' THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.registration_status IN ('verified', 'rejected') THEN
      RAISE EXCEPTION 'REGISTRATION_STATUS: record a registration check first';
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.registration_status IS DISTINCT FROM OLD.registration_status AND NEW.registration_status <> 'unverified' THEN
    SELECT outcome INTO latest FROM aksh.registration_checks
     WHERE membership_id = NEW.id AND organisation_id = NEW.organisation_id ORDER BY id DESC LIMIT 1;
    IF latest IS DISTINCT FROM NEW.registration_status THEN
      RAISE EXCEPTION 'REGISTRATION_STATUS: record a registration check first';
    END IF;
  END IF;
  RETURN NEW;
END $$;

-- 5. What this database is, stored in the database (set by scripts/db-mark-deployment.ts). Test and seed tooling refuses
--    to write when it reads 'production'. Owner-only.
CREATE TABLE IF NOT EXISTS aksh.deployment_marker (
  singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
  deployment TEXT NOT NULL CHECK (deployment IN ('production', 'simulation')),
  marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE aksh.deployment_marker ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON aksh.deployment_marker FROM aksh_tenant;
