/**
 * INT-10 — clinical persona gate for connected diabetes Accept/Edit/Reject.
 *
 * Review-case `evaluateDecisionScope` is ReviewCase-shaped; module HITL uses this
 * lighter policy so GP (or pharmacist for med surfaces) is the confirming actor,
 * nurses may only confirm continuous-care escalations, and non-clinical personas
 * are denied. Does not replace INT-09 patient URL access.
 */

import { NextResponse } from "next/server";

import type { DecisionScopeResult } from "../clinical-decision-scope";
import type { ClinicalPersona } from "../user-scope";

export type ConnectedDiabetesDecisionKind =
  | "journey_care_plan"
  | "glucose_review"
  | "medcare_care_plan"
  | "medcare_reconciliation"
  | "medcare_safety_review"
  | "patient360_reconciliation"
  | "continuous_escalation"
  | "agent_draft";

const PHARMACIST_KINDS: ReadonlySet<ConnectedDiabetesDecisionKind> = new Set([
  "medcare_care_plan",
  "medcare_reconciliation",
  "medcare_safety_review",
  "patient360_reconciliation",
]);

const NURSE_KINDS: ReadonlySet<ConnectedDiabetesDecisionKind> = new Set([
  "continuous_escalation",
]);

/**
 * Who may confirm Accept/Edit/Reject (or escalation resolve/queue) on a module surface.
 * Returns `{ allowed: true }` or a reason string for 403 responses.
 */
export function evaluateConnectedDiabetesDecisionScope(input: {
  persona: ClinicalPersona | null;
  kind: ConnectedDiabetesDecisionKind;
}): DecisionScopeResult {
  const { persona, kind } = input;

  if (persona === "gp") return { allowed: true };

  if (persona === null) {
    return {
      allowed: false,
      reason:
        "Connected diabetes Accept/Edit/Reject requires a clinical persona (GP, pharmacist, or nurse for escalations).",
    };
  }

  if (persona === "clinical-pharmacist") {
    if (PHARMACIST_KINDS.has(kind)) return { allowed: true };
    return {
      allowed: false,
      reason: `Pharmacist sessions may confirm medication reconciliation / safety / medcare care-plan decisions only; ${kind} needs the GP.`,
    };
  }

  // nurse
  if (NURSE_KINDS.has(kind)) return { allowed: true };
  return {
    allowed: false,
    reason:
      "Nurse sessions may confirm continuous-care escalations, but care-plan / glucose / agent Accept/Edit/Reject belongs to the GP (or pharmacist on med surfaces).",
  };
}

/**
 * Returns a 403 JSON response when the signed-in clinical persona may not decide `kind`.
 * Returns `null` when allowed (continue the handler).
 */
export function denyUnlessConnectedDiabetesDecisionScope(
  persona: ClinicalPersona | null,
  kind: ConnectedDiabetesDecisionKind
): NextResponse | null {
  const scope = evaluateConnectedDiabetesDecisionScope({ persona, kind });
  if (!scope.allowed) {
    return NextResponse.json(
      {
        error: `Forbidden. ${scope.reason}`,
        denied: true,
        decidedByPersona: persona,
        ehrWrite: false,
      },
      { status: 403 }
    );
  }
  return null;
}
