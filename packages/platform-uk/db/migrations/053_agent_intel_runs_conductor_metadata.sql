-- 053: Extend agent_intel_runs for CONDUCTOR / clinical-spine durable execution metadata (Milestone A2).
-- Reuses existing agent_intel_runs — no second orchestrator table. Local-dev / simulation Neon only.

CREATE SCHEMA IF NOT EXISTS aksh;

ALTER TABLE aksh.agent_intel_runs DROP CONSTRAINT IF EXISTS agent_intel_runs_status_check;
ALTER TABLE aksh.agent_intel_runs
  ADD CONSTRAINT agent_intel_runs_status_check
  CHECK (status IN ('running', 'completed', 'partial', 'failed', 'blocked', 'timed_out'));

ALTER TABLE aksh.agent_intel_runs ADD COLUMN IF NOT EXISTS correlation_id TEXT;
ALTER TABLE aksh.agent_intel_runs ADD COLUMN IF NOT EXISTS care_episode_id TEXT;
ALTER TABLE aksh.agent_intel_runs ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
ALTER TABLE aksh.agent_intel_runs ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'diabetes_agent_intel';
ALTER TABLE aksh.agent_intel_runs ADD COLUMN IF NOT EXISTS guardian_outcome TEXT;
ALTER TABLE aksh.agent_intel_runs ADD COLUMN IF NOT EXISTS review_status TEXT;
ALTER TABLE aksh.agent_intel_runs ADD COLUMN IF NOT EXISTS draft_enqueue_allowed BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE aksh.agent_intel_runs ADD COLUMN IF NOT EXISTS shield_audit_persisted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE aksh.agent_intel_runs ADD COLUMN IF NOT EXISTS execution_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE aksh.agent_intel_runs ADD COLUMN IF NOT EXISTS result_snapshot JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_intel_runs_idempotency
  ON aksh.agent_intel_runs (scope_key, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agent_intel_runs_correlation
  ON aksh.agent_intel_runs (scope_key, correlation_id)
  WHERE correlation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agent_intel_runs_care_episode
  ON aksh.agent_intel_runs (scope_key, care_episode_id)
  WHERE care_episode_id IS NOT NULL;
