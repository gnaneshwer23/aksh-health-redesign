-- Continuous-learning recorder (append-only). No UPDATE/DELETE in application paths.
CREATE SCHEMA IF NOT EXISTS aksh;

CREATE TABLE IF NOT EXISTS aksh.learning_events (
  id TEXT PRIMARY KEY,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  practice_id TEXT,
  case_id TEXT,
  queue_item_id TEXT,
  patient_id TEXT,
  agent_label TEXT NOT NULL,
  prediction_id TEXT NOT NULL,
  prediction_summary TEXT,
  model_version TEXT,
  decision TEXT NOT NULL,
  decision_actor TEXT NOT NULL,
  decision_notes TEXT,
  outcome_kind TEXT NOT NULL,
  outcome_summary TEXT,
  outcome_metric JSONB,
  auto_retrain_triggered BOOLEAN NOT NULL DEFAULT FALSE,
  model_updated BOOLEAN NOT NULL DEFAULT FALSE,
  ehr_write BOOLEAN NOT NULL DEFAULT FALSE,
  hitl_required BOOLEAN NOT NULL DEFAULT TRUE,
  governance_note TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_learning_events_recorded_at
  ON aksh.learning_events (recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_learning_events_case_id
  ON aksh.learning_events (case_id);

CREATE INDEX IF NOT EXISTS idx_learning_events_prediction_id
  ON aksh.learning_events (prediction_id);

CREATE INDEX IF NOT EXISTS idx_learning_events_agent_label
  ON aksh.learning_events (agent_label);
