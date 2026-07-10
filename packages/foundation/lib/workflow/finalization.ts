import type { FinalizationState, ReviewerDecision, WorkflowStatus } from "../types";

export function severityLabel(flagCount: number) {
  if (flagCount >= 2) return "High attention";
  if (flagCount === 1) return "Needs review";
  return "Ready";
}

export function toStatus(decision: ReviewerDecision): WorkflowStatus {
  if (decision === "accept") return "accepted";
  if (decision === "reject") return "rejected";
  return "deferred";
}

export function decisionLabel(decision: ReviewerDecision) {
  if (decision === "accept") return "Draft accepted";
  if (decision === "reject") return "Draft rejected";
  return "Case deferred";
}

export function finalizationStateLabel(state: FinalizationState) {
  if (state === "blocked") return "Blocked";
  if (state === "warn") return "Ready with warnings";
  return "Ready";
}
