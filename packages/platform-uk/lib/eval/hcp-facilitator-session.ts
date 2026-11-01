/**
 * Milestone C1 — pure helpers for facilitator HCP session UI wiring.
 * Synthetic evaluation only. Does not constitute clinical validation.
 */

import { HCP_RUBRIC_IDS, type HcpFeedbackDecision, type HcpRubricId, type HcpRubricScore } from "./hcp-feedback";
import type { HcpEvalCase } from "./hcp-case-pack";
import type { GoldenCase } from "./golden-cases";

export const HCP_FACILITATOR_SESSION_PATH = "/dashboard/gp/hcp-eval-session" as const;
export const HCP_FACILITATOR_ADMIN_PATH = "/dashboard/admin/hcp-eval-session" as const;

export const HCP_FACILITATOR_HONESTY = [
  "Simulation / synthetic validation — not a clinical device certification.",
  "Acceptance rate is a workflow metric, not a clinical accuracy score.",
  "HCP rubric scores are facilitator feedback for product rehearsal — not clinical validation of accuracy or safety.",
  "Lab and pharmacy paths remain simulation-labelled. ehrWrite: false. No live EPS / EHR / PACS.",
  "PRISM/ATLAS are scaffolds — never present as live CONDUCTOR actors.",
] as const;

const RUBRIC_LABELS: Record<HcpRubricId, string> = {
  synthesis_completeness: "SYNTHESIS — completeness",
  synthesis_no_invented_findings: "SYNTHESIS — no invented findings",
  synthesis_safety_notes: "SYNTHESIS — safety notes",
  guardian_interaction_flagged: "GUARDIAN — interaction/allergy flagged",
  guardian_data_source_disclosed: "GUARDIAN — data source disclosed",
  horizon_risk_plausible: "HORIZON — risk plausible",
  horizon_no_invented_labs: "HORIZON — no invented labs",
  drassist_codes_plausible: "DrASSIST — codes plausible",
  conductor_review_order: "CONDUCTOR — review order",
  conductor_hitl_not_bypassed: "CONDUCTOR — HITL not bypassed",
  honesty_labels_trusted: "Trust — honesty labels believed",
  workflow_fit: "Workflow fit",
};

/** Rubrics most relevant to a case's focus agents (fallback: honesty + workflow). */
export function suggestRubricsForCase(evalCase: HcpEvalCase): HcpRubricId[] {
  const focus = new Set(evalCase.rubricAgents.map((a) => a.toUpperCase()));
  const picked: HcpRubricId[] = [];
  const push = (id: HcpRubricId) => {
    if (!picked.includes(id)) picked.push(id);
  };

  if (focus.has("SYNTHESIS")) {
    push("synthesis_completeness");
    push("synthesis_no_invented_findings");
    push("synthesis_safety_notes");
  }
  if (focus.has("GUARDIAN") || focus.has("GUARDIAN_GATEWAY")) {
    push("guardian_interaction_flagged");
    push("guardian_data_source_disclosed");
  }
  if (focus.has("HORIZON") || focus.has("ORACLE")) {
    push("horizon_risk_plausible");
    push("horizon_no_invented_labs");
  }
  if (focus.has("DRASSIST") || focus.has("DR_ASSIST")) {
    push("drassist_codes_plausible");
  }
  if (focus.has("CONDUCTOR") || focus.has("PATHWAY") || focus.has("BRIDGE")) {
    push("conductor_review_order");
    push("conductor_hitl_not_bypassed");
  }
  push("honesty_labels_trusted");
  push("workflow_fit");
  return picked;
}

export function rubricLabel(id: HcpRubricId): string {
  return RUBRIC_LABELS[id] ?? id;
}

export function allRubricOptions(): { id: HcpRubricId; label: string }[] {
  return HCP_RUBRIC_IDS.map((id) => ({ id, label: rubricLabel(id) }));
}

/**
 * Match golden harness fixtures already available for the selected case
 * (by synthetic patient id, proposed drug, or overlapping agent label).
 */
export function relatedGoldenFixtures(
  evalCase: HcpEvalCase,
  fixtures: Pick<GoldenCase, "id" | "agent" | "label" | "input">[]
): Pick<GoldenCase, "id" | "agent" | "label" | "input">[] {
  const agents = new Set(evalCase.rubricAgents.map((a) => a.toUpperCase()));
  const patientId = evalCase.syntheticPatientId;
  const drug = evalCase.proposedDrug?.toLowerCase();

  return fixtures.filter((f) => {
    const agent = f.agent.toUpperCase();
    const agentHit =
      agents.has(agent) ||
      (agent === "ORACLE" && (agents.has("HORIZON") || agents.has("ORACLE"))) ||
      (agent === "GUARDIAN" && agents.has("GUARDIAN_GATEWAY"));
    const patientHit = Boolean(f.input.patientId && f.input.patientId === patientId);
    const drugHit = Boolean(drug && f.input.proposedDrug?.toLowerCase() === drug);
    return agentHit || patientHit || drugHit;
  });
}

export type FacilitatorFeedbackDraft = {
  casePackCaseId: string;
  agentLabel: string;
  decision: HcpFeedbackDecision;
  syntheticPatientId?: string;
  sessionId?: string;
  facilitatorNotes?: string;
  safetyMiss?: boolean;
  safetyMissDetail?: string;
  rubrics: HcpRubricScore[];
  trustHonestyLabels?: number;
  recommendation?: "proceed" | "hold" | "redesign";
};

/** Client-side contract check mirroring API assertions (before POST). */
export function validateFacilitatorFeedbackDraft(draft: FacilitatorFeedbackDraft): string | null {
  if (!draft.casePackCaseId?.trim()) return "Select a case-pack case.";
  if (!draft.agentLabel?.trim()) return "Select an agent label.";
  if (!["accept", "edit", "reject"].includes(draft.decision)) {
    return 'Decision must be Accept, Edit, or Reject.';
  }
  if (!Array.isArray(draft.rubrics) || draft.rubrics.length === 0) {
    return "Score at least one rubric (1–5).";
  }
  for (const row of draft.rubrics) {
    if (!HCP_RUBRIC_IDS.includes(row.rubricId as HcpRubricId)) {
      return `Unknown rubricId "${row.rubricId}".`;
    }
    if (!Number.isFinite(row.score) || row.score < 1 || row.score > 5) {
      return `Rubric score for ${row.rubricId} must be 1–5.`;
    }
    if (row.score <= 3 && !(row.justification && row.justification.trim().length >= 3)) {
      return `Justification required when score ≤3 (${row.rubricId}).`;
    }
  }
  if (draft.trustHonestyLabels != null) {
    if (
      !Number.isFinite(draft.trustHonestyLabels) ||
      draft.trustHonestyLabels < 1 ||
      draft.trustHonestyLabels > 5
    ) {
      return "Trust in honesty labels must be 1–5 when set.";
    }
  }
  if (draft.safetyMiss && !(draft.safetyMissDetail && draft.safetyMissDetail.trim().length >= 3)) {
    return "Describe the safety miss when flagged.";
  }
  return null;
}

export function buildHcpFeedbackRequestBody(draft: FacilitatorFeedbackDraft) {
  return {
    casePackCaseId: draft.casePackCaseId.trim(),
    agentLabel: draft.agentLabel.trim(),
    decision: draft.decision,
    syntheticPatientId: draft.syntheticPatientId?.trim() || undefined,
    sessionId: draft.sessionId?.trim() || undefined,
    facilitatorNotes: draft.facilitatorNotes?.trim() || undefined,
    safetyMiss: Boolean(draft.safetyMiss),
    safetyMissDetail: draft.safetyMiss ? draft.safetyMissDetail?.trim() : undefined,
    rubrics: draft.rubrics.map((r) => ({
      rubricId: r.rubricId,
      score: r.score,
      justification: r.justification?.trim() || undefined,
    })),
    trustHonestyLabels: draft.trustHonestyLabels,
    recommendation: draft.recommendation,
  };
}
