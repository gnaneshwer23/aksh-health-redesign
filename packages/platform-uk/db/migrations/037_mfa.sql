-- 037: Two-step sign-in (TOTP authenticator codes). Owner-only tables: never readable from a tenant session.
CREATE TABLE IF NOT EXISTS aksh.user_mfa (
  user_id TEXT PRIMARY KEY REFERENCES aksh.users(id) ON DELETE CASCADE,
  secret_enc TEXT NOT NULL,              -- AES-256-GCM, key from MFA_ENCRYPTION_KEY (never stored here)
  enabled_at TIMESTAMPTZ,                -- null while enrolment is pending
  last_used_step BIGINT,                 -- a code is accepted once (replay protection)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS aksh.user_mfa_recovery (
  user_id TEXT NOT NULL REFERENCES aksh.users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  used_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, code_hash)
);
ALTER TABLE aksh.user_mfa ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.user_mfa_recovery ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON aksh.user_mfa, aksh.user_mfa_recovery FROM aksh_tenant;
