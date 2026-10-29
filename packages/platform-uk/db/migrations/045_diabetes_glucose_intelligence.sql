-- 045: Diabetes glucose intelligence (Phase 2).
-- Synthetic CGM/SMBG series, HbA1c series staging, clinician glucose-intelligence
-- review drafts + decisions (HITL; ehr_write always false).
-- Apply on simulation / local-dev Neon only. Never point agent workflows at production main.

CREATE SCHEMA IF NOT EXISTS aksh;

-- ---------------------------------------------------------------- glucose series (CGM / SMBG ingestion contract store)

CREATE TABLE IF NOT EXISTS aksh.glucose_series_readings (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  organisation_id TEXT,
  patient_id TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('cgm', 'smbg', 'lab_hba1c')),
  recorded_at TIMESTAMPTZ NOT NULL,
  value_numeric DOUBLE PRECISION NOT NULL,
  unit TEXT NOT NULL,
  -- mmol/L for glucose channels; mmol/mol for lab_hba1c
  value_mmol_l DOUBLE PRECISION,
  value_mmol_mol DOUBLE PRECISION,
  context TEXT,
  quality_flag TEXT NOT NULL DEFAULT 'ok'
    CHECK (quality_flag IN ('ok', 'stale', 'unverified', 'conflict', 'missing', 'unassessed', 'gap')),
  source_system TEXT NOT NULL DEFAULT 'synthetic_seed',
  source_reference TEXT,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  synthetic BOOLEAN NOT NULL DEFAULT TRUE,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_glucose_series_patient_time
  ON aksh.glucose_series_readings (scope_key, patient_id, channel, recorded_at);

-- ---------------------------------------------------------------- glucose intelligence review drafts (HITL)

CREATE TABLE IF NOT EXISTS aksh.glucose_intelligence_reviews (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  organisation_id TEXT,
  patient_id TEXT NOT NULL,
  patient_label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'APPROVED', 'REJECTED', 'SUPERSEDED')),
  summary_sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  calculation_explanations JSONB NOT NULL DEFAULT '[]'::jsonb,
  missing_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  quality_indicators JSONB NOT NULL DEFAULT '[]'::jsonb,
  worklist_urgency INTEGER NOT NULL DEFAULT 6,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_by TEXT,
  decided_at TIMESTAMPTZ,
  decision_reason TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  hitl_required BOOLEAN NOT NULL DEFAULT TRUE,
  ehr_write BOOLEAN NOT NULL DEFAULT FALSE,
  synthetic BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_glucose_intel_reviews_patient
  ON aksh.glucose_intelligence_reviews (scope_key, patient_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS aksh.glucose_intelligence_review_decisions (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  review_id TEXT NOT NULL REFERENCES aksh.glucose_intelligence_reviews(id),
  action TEXT NOT NULL CHECK (action IN ('accept', 'edit', 'reject')),
  actor TEXT NOT NULL,
  reason TEXT,
  edited_sections JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS glucose_intel_review_decisions_append_only
  ON aksh.glucose_intelligence_review_decisions;
CREATE TRIGGER glucose_intel_review_decisions_append_only
  BEFORE UPDATE OR DELETE ON aksh.glucose_intelligence_review_decisions
  FOR EACH ROW EXECUTE FUNCTION aksh.reject_mutation();

CREATE INDEX IF NOT EXISTS idx_glucose_intel_decisions_review
  ON aksh.glucose_intelligence_review_decisions (scope_key, review_id, created_at);

-- ---------------------------------------------------------------- RLS

ALTER TABLE aksh.glucose_series_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.glucose_intelligence_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.glucose_intelligence_review_decisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS glucose_series_readings_org ON aksh.glucose_series_readings;
CREATE POLICY glucose_series_readings_org ON aksh.glucose_series_readings FOR ALL TO aksh_tenant
  USING (organisation_id IS NULL OR organisation_id = ANY (aksh.ctx_org_ids()))
  WITH CHECK (organisation_id IS NULL OR organisation_id = ANY (aksh.ctx_org_ids()));

DROP POLICY IF EXISTS glucose_intelligence_reviews_org ON aksh.glucose_intelligence_reviews;
CREATE POLICY glucose_intelligence_reviews_org ON aksh.glucose_intelligence_reviews FOR ALL TO aksh_tenant
  USING (organisation_id IS NULL OR organisation_id = ANY (aksh.ctx_org_ids()))
  WITH CHECK (organisation_id IS NULL OR organisation_id = ANY (aksh.ctx_org_ids()));

-- Decisions inherit org scope via parent review (no organisation_id on decisions rows).
DROP POLICY IF EXISTS glucose_intel_decisions_via_review ON aksh.glucose_intelligence_review_decisions;
CREATE POLICY glucose_intel_decisions_via_review ON aksh.glucose_intelligence_review_decisions FOR ALL TO aksh_tenant
  USING (
    EXISTS (
      SELECT 1 FROM aksh.glucose_intelligence_reviews r
      WHERE r.id = review_id
        AND (r.organisation_id IS NULL OR r.organisation_id = ANY (aksh.ctx_org_ids()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM aksh.glucose_intelligence_reviews r
      WHERE r.id = review_id
        AND (r.organisation_id IS NULL OR r.organisation_id = ANY (aksh.ctx_org_ids()))
    )
  );

GRANT SELECT, INSERT, UPDATE ON aksh.glucose_series_readings, aksh.glucose_intelligence_reviews TO aksh_tenant;
GRANT SELECT, INSERT ON aksh.glucose_intelligence_review_decisions TO aksh_tenant;
