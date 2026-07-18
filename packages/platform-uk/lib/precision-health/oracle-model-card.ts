/**
 * ORACLE predictive model ownership card (Phase 2 readiness).
 * No silent auto-retrain — releases follow GOVERNED_MODEL_RELEASE_SOP.
 */

export type OracleModelCard = {
  modelId: string;
  version: string;
  clinicalOwner: string;
  evalHarnessRef: string;
  lastReviewed: string;
  autoRetrain: false;
  governedReleaseSop: string;
  physiologicalTwin: false;
  note: string;
};

/** Static owned model card — clinical owner placeholder until CSO names a person. */
export const ORACLE_MODEL_CARD: OracleModelCard = {
  modelId: "aksh-oracle-risk-state",
  version: "0.2.0-phase2-scaffold",
  clinicalOwner: "UNASSIGNED — CSO must name clinical owner before live pilot use",
  evalHarnessRef: "docs/AGENT_EVAL_HARNESS.md · npm run eval:agents",
  lastReviewed: "2026-07-18",
  autoRetrain: false,
  governedReleaseSop: "docs/GOVERNED_MODEL_RELEASE_SOP.md",
  physiologicalTwin: false,
  note:
    "Risk-state / ORACLE draft model card. Version bumps require G-ML-1…3 — never from learning events."
};

export function getOracleModelCard(): OracleModelCard {
  return { ...ORACLE_MODEL_CARD };
}
