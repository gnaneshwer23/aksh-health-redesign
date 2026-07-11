CREATE SCHEMA IF NOT EXISTS aksh;

ALTER TABLE aksh.users
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS aksh.email_verification_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES aksh.users (id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id
  ON aksh.email_verification_tokens (user_id);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires_at
  ON aksh.email_verification_tokens (expires_at);
