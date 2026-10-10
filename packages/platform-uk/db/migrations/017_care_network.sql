-- 017: Care network in the database — organisations, members, invites, patients, care teams, consent,
-- observations and medicines — with row-level security enforced through a restricted role.
--
-- Why a role: the application connects as the database owner, which has BYPASSRLS, so policies alone are not
-- enforced. Every tenant-scoped request runs `SET LOCAL ROLE aksh_tenant` inside its transaction and sets
-- app.user_id / app.org_ids / app.patient_ids. aksh_tenant has no BYPASSRLS, so the policies below apply.
-- Policies fail closed: no context, no rows.

CREATE SCHEMA IF NOT EXISTS aksh;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'aksh_tenant') THEN
    CREATE ROLE aksh_tenant NOLOGIN NOBYPASSRLS;
  END IF;
END $$;
GRANT aksh_tenant TO CURRENT_USER;
GRANT USAGE ON SCHEMA aksh TO aksh_tenant;

-- ---------------------------------------------------------------- organisations

CREATE TABLE IF NOT EXISTS aksh.organisations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN (
    'clinic', 'diabetes_centre', 'hospital', 'pharmacy', 'lab', 'payer', 'research', 'device_partner', 'other'
  )),
  -- Go-live is a product state, never a flag flipped in code.
  status TEXT NOT NULL DEFAULT 'sandbox' CHECK (status IN ('sandbox', 'onboarding', 'live_read_only', 'live', 'suspended')),
  region TEXT,
  -- timezone, language, glucoseUnit, hba1cUnit, emergencyNumber, urgentAdviceLine, crisisLine
  locale JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Simulation-only organisations visible to signed-out visitors of a non-production deployment.
  public_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_by TEXT REFERENCES aksh.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);

-- ---------------------------------------------------------------- memberships (staff)

CREATE TABLE IF NOT EXISTS aksh.memberships (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organisation_id TEXT NOT NULL REFERENCES aksh.organisations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES aksh.users(id) ON DELETE CASCADE,
  -- Platform role (gp, nurse, clinical-pharmacist, practice-manager, ...) plus the organisation's own title.
  role TEXT NOT NULL,
  professional_title TEXT,
  -- Copied at join time so tenant queries never need aksh.users (which holds password hashes).
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'left')),
  registration_number TEXT,
  registration_body TEXT,
  registration_status TEXT NOT NULL DEFAULT 'unverified' CHECK (registration_status IN ('unverified', 'verified', 'rejected', 'not_applicable')),
  invited_by TEXT REFERENCES aksh.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organisation_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON aksh.memberships (user_id) WHERE status = 'active';

-- ---------------------------------------------------------------- patients

CREATE TABLE IF NOT EXISTS aksh.network_patients (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organisation_id TEXT NOT NULL REFERENCES aksh.organisations(id) ON DELETE RESTRICT,
  record_ref TEXT,                       -- the organisation's own record number
  given_name TEXT NOT NULL,
  family_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  sex TEXT,
  diabetes_type TEXT,
  diagnosed_on DATE,
  contact JSONB NOT NULL DEFAULT '{}'::jsonb,   -- email, phone, preferred channel, language
  created_by TEXT REFERENCES aksh.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organisation_id, record_ref)
);
CREATE INDEX IF NOT EXISTS idx_network_patients_org ON aksh.network_patients (organisation_id);

-- A patient's own sign-in account, linked only through a single-use invite.
CREATE TABLE IF NOT EXISTS aksh.patient_accounts (
  patient_id TEXT PRIMARY KEY REFERENCES aksh.network_patients(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL UNIQUE REFERENCES aksh.users(id) ON DELETE CASCADE,
  invite_id TEXT,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------- invites (single use, hashed)

CREATE TABLE IF NOT EXISTS aksh.invites (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organisation_id TEXT NOT NULL REFERENCES aksh.organisations(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('staff', 'patient')),
  role TEXT,                             -- staff invites
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  email TEXT,                            -- optional binding to an address
  patient_id TEXT REFERENCES aksh.network_patients(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL UNIQUE,        -- sha256 of the code; the code itself is shown once
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  used_by TEXT REFERENCES aksh.users(id) ON DELETE SET NULL,
  revoked_at TIMESTAMPTZ,
  created_by TEXT REFERENCES aksh.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((kind = 'patient') = (patient_id IS NOT NULL))
);

-- ---------------------------------------------------------------- care teams and consent

-- Consent is append-only: a withdrawal is a new row. The current state is the latest row per
-- (patient, grantee organisation, purpose).
CREATE TABLE IF NOT EXISTS aksh.consent_records (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  patient_id TEXT NOT NULL REFERENCES aksh.network_patients(id) ON DELETE CASCADE,
  grantee_organisation_id TEXT NOT NULL REFERENCES aksh.organisations(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (purpose IN ('direct_care', 'care_coordination', 'contact', 'research')),
  status TEXT NOT NULL CHECK (status IN ('granted', 'withdrawn')),
  basis TEXT,                            -- e.g. explicit consent, direct-care basis — recorded, not inferred
  recorded_by TEXT REFERENCES aksh.users(id) ON DELETE SET NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_consent_current ON aksh.consent_records (patient_id, grantee_organisation_id, purpose, recorded_at DESC);

CREATE TABLE IF NOT EXISTS aksh.care_team_members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  patient_id TEXT NOT NULL REFERENCES aksh.network_patients(id) ON DELETE CASCADE,
  membership_id TEXT NOT NULL REFERENCES aksh.memberships(id) ON DELETE CASCADE,
  care_role TEXT NOT NULL,               -- lead clinician, pharmacist, educator, ...
  added_by TEXT REFERENCES aksh.users(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  UNIQUE (patient_id, membership_id, care_role)
);
CREATE INDEX IF NOT EXISTS idx_care_team_patient ON aksh.care_team_members (patient_id) WHERE ended_at IS NULL;

-- ---------------------------------------------------------------- clinical data

CREATE TABLE IF NOT EXISTS aksh.network_observations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  patient_id TEXT NOT NULL REFERENCES aksh.network_patients(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN (
    'hba1c', 'glucose', 'systolic_bp', 'diastolic_bp', 'weight', 'bmi', 'egfr', 'acr', 'ldl',
    'cgm_time_in_range', 'cgm_time_below_range', 'hypo_event'
  )),
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('lab', 'clinic', 'device', 'patient_reported')),
  -- Patient-reported and device data stay unverified until a clinician accepts them.
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  recorded_by TEXT REFERENCES aksh.users(id) ON DELETE SET NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_network_obs_patient ON aksh.network_observations (patient_id, kind, observed_at DESC);

CREATE TABLE IF NOT EXISTS aksh.network_medications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  patient_id TEXT NOT NULL REFERENCES aksh.network_patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  drug_class TEXT,
  dose TEXT,
  started_on DATE,
  ended_on DATE,
  recorded_by TEXT REFERENCES aksh.users(id) ON DELETE SET NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_network_meds_patient ON aksh.network_medications (patient_id);

-- ---------------------------------------------------------------- append-only audit

CREATE TABLE IF NOT EXISTS aksh.network_audit_events (
  id BIGSERIAL PRIMARY KEY,
  organisation_id TEXT,
  actor_user_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  environment TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION aksh.reject_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION '% is append-only', TG_TABLE_NAME;
END $$;

DROP TRIGGER IF EXISTS network_audit_append_only ON aksh.network_audit_events;
CREATE TRIGGER network_audit_append_only BEFORE UPDATE OR DELETE ON aksh.network_audit_events
  FOR EACH ROW EXECUTE FUNCTION aksh.reject_mutation();

DROP TRIGGER IF EXISTS consent_append_only ON aksh.consent_records;
CREATE TRIGGER consent_append_only BEFORE UPDATE OR DELETE ON aksh.consent_records
  FOR EACH ROW EXECUTE FUNCTION aksh.reject_mutation();

-- ---------------------------------------------------------------- access functions (run as owner)

CREATE OR REPLACE FUNCTION aksh.ctx_user() RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '')
$$;

CREATE OR REPLACE FUNCTION aksh.ctx_org_ids() RETURNS TEXT[] LANGUAGE sql STABLE AS $$
  SELECT COALESCE(string_to_array(NULLIF(current_setting('app.org_ids', true), ''), ','), ARRAY[]::TEXT[])
$$;

CREATE OR REPLACE FUNCTION aksh.ctx_patient_ids() RETURNS TEXT[] LANGUAGE sql STABLE AS $$
  SELECT COALESCE(string_to_array(NULLIF(current_setting('app.patient_ids', true), ''), ','), ARRAY[]::TEXT[])
$$;

CREATE OR REPLACE FUNCTION aksh.consent_granted(p_patient TEXT, p_org TEXT) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = aksh, pg_temp AS $$
  SELECT COALESCE((
    SELECT status = 'granted' FROM aksh.consent_records
    WHERE patient_id = p_patient AND grantee_organisation_id = p_org AND purpose IN ('direct_care', 'care_coordination')
    ORDER BY recorded_at DESC, id DESC LIMIT 1
  ), FALSE)
$$;

-- A patient row is visible to: its own organisation's members; members of another organisation who are on the
-- patient's active care team AND whose organisation holds current consent; and the patient themself.
CREATE OR REPLACE FUNCTION aksh.can_access_patient(p_patient TEXT) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = aksh, pg_temp AS $$
  SELECT aksh.ctx_user() IS NOT NULL AND (
    p_patient = ANY (aksh.ctx_patient_ids())
    OR EXISTS (SELECT 1 FROM aksh.network_patients p WHERE p.id = p_patient AND p.organisation_id = ANY (aksh.ctx_org_ids()))
    OR EXISTS (
      SELECT 1 FROM aksh.care_team_members ct
      JOIN aksh.memberships m ON m.id = ct.membership_id
      WHERE ct.patient_id = p_patient AND ct.ended_at IS NULL
        AND m.status = 'active' AND m.organisation_id = ANY (aksh.ctx_org_ids())
        AND aksh.consent_granted(p_patient, m.organisation_id)
    )
  )
$$;

-- ---------------------------------------------------------------- row-level security

ALTER TABLE aksh.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.network_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.patient_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.care_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.network_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.network_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.network_audit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS org_member_read ON aksh.organisations;
CREATE POLICY org_member_read ON aksh.organisations FOR SELECT TO aksh_tenant
  USING (id = ANY (aksh.ctx_org_ids()));
DROP POLICY IF EXISTS org_member_update ON aksh.organisations;
CREATE POLICY org_member_update ON aksh.organisations FOR UPDATE TO aksh_tenant
  USING (id = ANY (aksh.ctx_org_ids())) WITH CHECK (id = ANY (aksh.ctx_org_ids()));

DROP POLICY IF EXISTS membership_same_org ON aksh.memberships;
CREATE POLICY membership_same_org ON aksh.memberships FOR ALL TO aksh_tenant
  USING (organisation_id = ANY (aksh.ctx_org_ids())) WITH CHECK (organisation_id = ANY (aksh.ctx_org_ids()));

DROP POLICY IF EXISTS patient_access ON aksh.network_patients;
CREATE POLICY patient_access ON aksh.network_patients FOR SELECT TO aksh_tenant
  USING (aksh.can_access_patient(id));
DROP POLICY IF EXISTS patient_write_own_org ON aksh.network_patients;
CREATE POLICY patient_write_own_org ON aksh.network_patients FOR INSERT TO aksh_tenant
  WITH CHECK (organisation_id = ANY (aksh.ctx_org_ids()));
DROP POLICY IF EXISTS patient_update_own_org ON aksh.network_patients;
CREATE POLICY patient_update_own_org ON aksh.network_patients FOR UPDATE TO aksh_tenant
  USING (organisation_id = ANY (aksh.ctx_org_ids())) WITH CHECK (organisation_id = ANY (aksh.ctx_org_ids()));

DROP POLICY IF EXISTS patient_account_access ON aksh.patient_accounts;
CREATE POLICY patient_account_access ON aksh.patient_accounts FOR SELECT TO aksh_tenant
  USING (aksh.can_access_patient(patient_id));

DROP POLICY IF EXISTS invite_same_org ON aksh.invites;
CREATE POLICY invite_same_org ON aksh.invites FOR ALL TO aksh_tenant
  USING (organisation_id = ANY (aksh.ctx_org_ids())) WITH CHECK (organisation_id = ANY (aksh.ctx_org_ids()));

DROP POLICY IF EXISTS consent_read ON aksh.consent_records;
CREATE POLICY consent_read ON aksh.consent_records FOR SELECT TO aksh_tenant
  USING (aksh.can_access_patient(patient_id));
DROP POLICY IF EXISTS consent_insert ON aksh.consent_records;
CREATE POLICY consent_insert ON aksh.consent_records FOR INSERT TO aksh_tenant
  WITH CHECK (EXISTS (SELECT 1 FROM aksh.network_patients p WHERE p.id = patient_id AND p.organisation_id = ANY (aksh.ctx_org_ids()))
              OR patient_id = ANY (aksh.ctx_patient_ids()));

DROP POLICY IF EXISTS care_team_read ON aksh.care_team_members;
CREATE POLICY care_team_read ON aksh.care_team_members FOR SELECT TO aksh_tenant
  USING (aksh.can_access_patient(patient_id));
DROP POLICY IF EXISTS care_team_write ON aksh.care_team_members;
CREATE POLICY care_team_write ON aksh.care_team_members FOR ALL TO aksh_tenant
  USING (EXISTS (SELECT 1 FROM aksh.network_patients p WHERE p.id = patient_id AND p.organisation_id = ANY (aksh.ctx_org_ids())))
  WITH CHECK (EXISTS (SELECT 1 FROM aksh.network_patients p WHERE p.id = patient_id AND p.organisation_id = ANY (aksh.ctx_org_ids())));

DROP POLICY IF EXISTS obs_read ON aksh.network_observations;
CREATE POLICY obs_read ON aksh.network_observations FOR SELECT TO aksh_tenant
  USING (aksh.can_access_patient(patient_id));
DROP POLICY IF EXISTS obs_insert ON aksh.network_observations;
CREATE POLICY obs_insert ON aksh.network_observations FOR INSERT TO aksh_tenant
  WITH CHECK (aksh.can_access_patient(patient_id));

DROP POLICY IF EXISTS meds_read ON aksh.network_medications;
CREATE POLICY meds_read ON aksh.network_medications FOR SELECT TO aksh_tenant
  USING (aksh.can_access_patient(patient_id));
DROP POLICY IF EXISTS meds_write ON aksh.network_medications;
CREATE POLICY meds_write ON aksh.network_medications FOR INSERT TO aksh_tenant
  WITH CHECK (EXISTS (SELECT 1 FROM aksh.network_patients p WHERE p.id = patient_id AND p.organisation_id = ANY (aksh.ctx_org_ids())));

DROP POLICY IF EXISTS audit_insert ON aksh.network_audit_events;
CREATE POLICY audit_insert ON aksh.network_audit_events FOR INSERT TO aksh_tenant WITH CHECK (TRUE);
DROP POLICY IF EXISTS audit_read_own_org ON aksh.network_audit_events;
CREATE POLICY audit_read_own_org ON aksh.network_audit_events FOR SELECT TO aksh_tenant
  USING (organisation_id = ANY (aksh.ctx_org_ids()));

GRANT SELECT, INSERT, UPDATE ON aksh.organisations, aksh.memberships, aksh.network_patients, aksh.invites,
  aksh.care_team_members TO aksh_tenant;
GRANT SELECT, INSERT ON aksh.patient_accounts, aksh.consent_records, aksh.network_observations,
  aksh.network_medications, aksh.network_audit_events TO aksh_tenant;
GRANT USAGE ON SEQUENCE aksh.network_audit_events_id_seq TO aksh_tenant;
GRANT EXECUTE ON FUNCTION aksh.ctx_user(), aksh.ctx_org_ids(), aksh.ctx_patient_ids(),
  aksh.consent_granted(TEXT, TEXT), aksh.can_access_patient(TEXT) TO aksh_tenant;
