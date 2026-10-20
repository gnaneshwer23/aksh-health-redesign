/**
 * Case-level decisions, decided on the server: accept / reject / defer a whole case, and a clinician's decision on a
 * human gate (urgent concern, referral, medication). The browser used to apply these and save the whole case with
 * audit entries it wrote itself; now the server checks the version, the blockers and the gates, attributes the
 * decision to the signed-in account, and returns the next case plus the audit row to persist in the same transaction.
 * Pure: no I/O.
 */
import { createHumanGateDecision, deriveHumanGates, ensureHumanGateDecisionSnapshot } from "../human-gates";
import { appendCaseLevelShieldAudit } from "../shield-audit";
import { formatCaseTimestamp } from "../time-format";
import type { HumanGateDecisionStatus, HumanGateId, ReviewCase, ReviewerDecision } from "../types";

import { createFrozenArtifact } from "./evidence";
import { decisionLabel, toStatus } from "./finalization";
import { createReviewerEvent, deriveChecklistAcceptanceBlockers } from "./review";
import { deriveAcceptanceBlockers } from "./safety";

export class CaseDecisionError extends Error {
  constructor(
    readonly code: "STALE_CASE" | "CASE_FINAL" | "BLOCKED" | "ACKNOWLEDGEMENT_REQUIRED" | "GATE_NOT_APPLICABLE" | "INVALID",
    readonly status: 400 | 409,
    message: string,
    readonly blockers: string[] = []
  ) {
    super(`${code}: ${message}`);
  }
}

export type CaseDecisionRequest = {
  decision: ReviewerDecision;
  expectedVersion: number;
  notes?: string;
  overrideReason?: string;
  /** The clinician confirmed the clinical accountability check (required to accept). */
  acknowledged: boolean;
};

export type GateDecisionRequest = { gateId: HumanGateId; status: HumanGateDecisionStatus; note?: string; expectedVersion: number };

const GATES: HumanGateId[] = ["red_flag_escalation", "referral_pathway", "medication_decision"];
const GATE_STATUS: HumanGateDecisionStatus[] = ["open", "confirmed", "not_applicable"];
const text = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);

function versionOf(b: Record<string, unknown>) {
  const v = Number(b.expectedVersion);
  if (!Number.isInteger(v) || v < 0) throw new CaseDecisionError("INVALID", 400, "expectedVersion is required");
  return v;
}

export function parseCaseDecision(body: unknown): CaseDecisionRequest {
  const b = (body ?? {}) as Record<string, unknown>;
  if (b.decision !== "accept" && b.decision !== "reject" && b.decision !== "defer") throw new CaseDecisionError("INVALID", 400, "decision must be accept, reject or defer");
  return { decision: b.decision, expectedVersion: versionOf(b), notes: text(b.notes, 4000), overrideReason: text(b.overrideReason, 2000), acknowledged: b.acknowledged === true };
}

export function parseGateDecision(gateId: string, body: unknown): GateDecisionRequest {
  const b = (body ?? {}) as Record<string, unknown>;
  if (!GATES.includes(gateId as HumanGateId)) throw new CaseDecisionError("INVALID", 400, "unknown gate");
  if (!GATE_STATUS.includes(b.status as HumanGateDecisionStatus)) throw new CaseDecisionError("INVALID", 400, "status must be open, confirmed or not_applicable");
  return { gateId: gateId as HumanGateId, status: b.status as HumanGateDecisionStatus, note: text(b.note, 2000), expectedVersion: versionOf(b) };
}

function checkVersion(existing: ReviewCase, expected: number) {
  const current = existing.version ?? 0;
  if (expected !== current) throw new CaseDecisionError("STALE_CASE", 409, "the case changed since you opened it; reload to see the latest version");
  if (existing.status === "accepted") throw new CaseDecisionError("CASE_FINAL", 409, "this case was already accepted; its evidence is frozen");
  return current;
}

/** Everything that stops a case being accepted: safety blockers, the reviewer checklist, and required human gates. */
export function caseAcceptanceBlockers(reviewCase: ReviewCase): string[] {
  return [
    ...deriveAcceptanceBlockers(reviewCase),
    ...deriveChecklistAcceptanceBlockers(reviewCase),
    ...deriveHumanGates(reviewCase).filter((g) => g.status === "required").map((g) => `${g.label} still requires an explicit reviewer decision.`),
  ];
}

export function decideReviewCase(existing: ReviewCase, req: CaseDecisionRequest, actor: string) {
  const current = checkVersion(existing, req.expectedVersion);
  const working: ReviewCase = {
    ...existing,
    reviewSummary: { ...existing.reviewSummary, lastReviewer: actor, reviewerNotes: req.notes ?? existing.reviewSummary?.reviewerNotes ?? "", overrideReason: req.overrideReason ?? "" },
  };
  if (req.decision === "accept") {
    if (!req.acknowledged) throw new CaseDecisionError("ACKNOWLEDGEMENT_REQUIRED", 400, "confirm the clinical accountability check before accepting this case");
    const blockers = caseAcceptanceBlockers(working);
    if (blockers.length) throw new CaseDecisionError("BLOCKED", 409, blockers[0]!, blockers);
  }
  const at = formatCaseTimestamp();
  const events = [
    createReviewerEvent("reviewer_decision", decisionLabel(req.decision), actor, req.notes || undefined),
    ...(req.decision === "accept" && req.overrideReason ? [createReviewerEvent("override", "Override reason recorded", actor, req.overrideReason)] : []),
  ];
  let next: ReviewCase = {
    ...working,
    status: toStatus(req.decision),
    updatedAt: at,
    auditEvents: [...existing.auditEvents, ...events],
    humanGateDecisions: ensureHumanGateDecisionSnapshot(working, { decidedAt: at, decidedBy: actor }),
    reviewSummary: { ...working.reviewSummary, lastDecision: req.decision, lastDecisionAt: at },
  };
  if (req.decision === "accept") next = { ...next, frozenArtifact: createFrozenArtifact(next, { frozenBy: actor }) };
  const detail = req.decision === "accept" ? `Case ${existing.id} accepted with frozen evidence artifact` : `Case ${existing.id} marked ${req.decision}`;
  next = appendCaseLevelShieldAudit(next, { action: req.decision, actor, detail, durableAudit: false });
  next = { ...next, version: current + 1 };
  return {
    next,
    outcome: { decision: req.decision, status: next.status, decidedBy: actor, decidedAt: at, version: current + 1 },
    audit: {
      action: req.decision,
      actor,
      label: `Case ${decisionLabel(req.decision).toLowerCase()}`,
      detail: req.overrideReason ? `Override: ${req.overrideReason}` : req.notes,
      category: "reviewer_decision",
      caseId: existing.id,
      practiceId: existing.practiceId ?? null,
      resourceRef: `ReviewCase/${existing.id}`,
      payload: { fromVersion: current, toVersion: current + 1, scope: "case" },
    },
  };
}

export function decideHumanGate(existing: ReviewCase, req: GateDecisionRequest, actor: string) {
  const current = checkVersion(existing, req.expectedVersion);
  const gate = deriveHumanGates(existing).find((g) => g.id === req.gateId);
  if (!gate || gate.status === "clear") throw new CaseDecisionError("GATE_NOT_APPLICABLE", 409, "this gate does not apply to this case");
  const at = formatCaseTimestamp();
  const decision = createHumanGateDecision({ id: req.gateId, status: req.status, note: req.note, decidedAt: at, decidedBy: actor });
  const label = req.gateId.replace(/_/g, " ");
  const next: ReviewCase = {
    ...existing,
    updatedAt: at,
    humanGateDecisions: [...(existing.humanGateDecisions ?? []).filter((d) => d.id !== req.gateId), decision],
    auditEvents: [
      ...existing.auditEvents,
      createReviewerEvent("reviewer_note", "Human gate decision recorded", actor, `${label} marked ${req.status.replace(/_/g, " ")}${req.note ? `: ${req.note}` : ""}`),
    ],
    version: current + 1,
  };
  return {
    next,
    outcome: { gateId: req.gateId, status: req.status, decidedBy: actor, decidedAt: at, version: current + 1 },
    audit: {
      action: "gate_decision",
      actor,
      label: `Human gate ${label} → ${req.status}`,
      detail: req.note,
      category: "reviewer_decision",
      caseId: existing.id,
      practiceId: existing.practiceId ?? null,
      resourceRef: `ReviewCase/${existing.id}#gate:${req.gateId}`,
      payload: { fromVersion: current, toVersion: current + 1, scope: "gate", gateId: req.gateId },
    },
  };
}
