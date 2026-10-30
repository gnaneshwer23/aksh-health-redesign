/**
 * Milestone A4 — agent / ops / review authorisation allow-lists.
 * Server routes must enforce these via `requireAppRole`; UI hiding is not sufficient.
 */
import type { AppRole } from "../permission-matrix";

/** Roles permitted to invoke CONDUCTOR / clinical agent draft APIs. */
export const AGENT_INVOKE_ROLES: AppRole[] = ["clinical_reviewer"];

/** Roles permitted to inspect durable Agent Ops run/alert surfaces. */
export const AGENT_OPS_ROLES: AppRole[] = ["operations_lead", "clinical_reviewer"];

/** Roles permitted to assign / escalate GP review-queue items. */
export const REVIEW_QUEUE_MUTATE_ROLES: AppRole[] = ["clinical_reviewer"];

/** Roles permitted to record clinical Accept/Edit/Reject. */
export const REVIEW_DECISION_ROLES: AppRole[] = ["clinical_reviewer"];

export type AgentAuthzAction =
  | "agent_invoke"
  | "agent_ops_inspect"
  | "review_queue_mutate"
  | "capture_reviewer_decision";

const ACTION_ROLES: Record<AgentAuthzAction, readonly AppRole[]> = {
  agent_invoke: AGENT_INVOKE_ROLES,
  agent_ops_inspect: AGENT_OPS_ROLES,
  review_queue_mutate: REVIEW_QUEUE_MUTATE_ROLES,
  capture_reviewer_decision: REVIEW_DECISION_ROLES,
};

export function rolesForAgentAuthz(action: AgentAuthzAction): AppRole[] {
  return [...ACTION_ROLES[action]];
}

export function evaluateAgentAuthz(input: {
  action: AgentAuthzAction;
  role: AppRole;
}): { allowed: boolean; reason: string } {
  const allowedRoles = ACTION_ROLES[input.action];
  if (allowedRoles.includes(input.role)) {
    return { allowed: true, reason: `${input.role} permitted for ${input.action}` };
  }
  return {
    allowed: false,
    reason: `Role "${input.role}" is denied for ${input.action}`,
  };
}

/** Pure cross-tenant denial for durable ops / review stores. */
export function evaluateScopeIsolation(input: {
  requestScopeKey: string;
  resourceScopeKey: string;
}): { allowed: boolean; reason: string } {
  const request = input.requestScopeKey.trim();
  const resource = input.resourceScopeKey.trim();
  if (!request || !resource) {
    return { allowed: false, reason: "Missing scopeKey — fail closed" };
  }
  if (request !== resource) {
    return { allowed: false, reason: "CROSS_TENANT scopeKey mismatch" };
  }
  return { allowed: true, reason: "scopeKey match" };
}
