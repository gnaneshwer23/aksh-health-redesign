CREATE TABLE IF NOT EXISTS patients (
    patient_key TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consent_grants (
    token TEXT PRIMARY KEY,
    patient_key TEXT NOT NULL REFERENCES patients(patient_key),
    scopes TEXT[] NOT NULL,
    proxy_key TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consent_grants_patient_key ON consent_grants(patient_key);
