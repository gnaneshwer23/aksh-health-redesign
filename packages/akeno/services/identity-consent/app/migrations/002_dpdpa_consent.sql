-- DPDPA consent extension: purpose limitation, retention, withdrawal audit (Phase 0)
-- Apply via identity-consent service db_migrations on startup

ALTER TABLE consent_grants
  ADD COLUMN IF NOT EXISTS purpose TEXT,
  ADD COLUMN IF NOT EXISTS retention_days INTEGER,
  ADD COLUMN IF NOT EXISTS granted_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS withdrawn_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS withdrawal_reason TEXT;

CREATE TABLE IF NOT EXISTS consent_audit_log (
  id BIGSERIAL PRIMARY KEY,
  token TEXT,
  patient_key TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('grant', 'revoke', 'validate', 'expire')),
  purpose TEXT,
  scopes TEXT[],
  retention_days INTEGER,
  actor TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consent_audit_patient_key ON consent_audit_log(patient_key);
CREATE INDEX IF NOT EXISTS idx_consent_audit_token ON consent_audit_log(token);

COMMENT ON TABLE consent_audit_log IS 'DPDPA append-only consent audit trail — India ap-south-1 data plane only';
