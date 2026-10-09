import { deriveHumanGates } from "@/lib/human-gates";
import type { HumanGateId, ReviewCase } from "@/lib/types";
import type { ClinicalPersona } from "@/lib/user-scope";

/**
 * EC-CLIN-3 / REQ-021: who may record a disposition, enforced server-side.
 *
 * - GP: confirming actor for every gate and case disposition.
 * - Clinical pharmacist: confirming actor for `medication_decision` only (GP co-accountable).
 *   May not confirm `red_flag_escalation` / `referral_pathway`, and may not change the case
 *   disposition while either of those gates is still required.
 * - Nurse: may raise and observe; never the confirming actor on a case disposition or gate.
 *
 * Volume I §5.2.1 "who may act", FR-CLIN-008, FLOW-JRN-2 actors.
 */

export type DecisionScopeResult = { allowed: true } | { allowed: false; reason: string };

const PHARMACIST_GATES: ReadonlySet<HumanGateId> = new Set(["medication_decision"]);

function newlyDecidedGates(existing: ReviewCase, next: ReviewCase): HumanGateId[] {
  const before = new Map((existing.humanGateDecisions ?? []).map((d) => [d.id, d.status]));
  return (next.humanGateDecisions ?? [])
    .filter((d) => d.status !== "open" && before.get(d.id) !== d.status)
    .map((d) => d.id);
}

export function evaluateDecisionScope(input: {
  persona: ClinicalPersona | null;
  existing: ReviewCase;
  next: ReviewCase;
}): DecisionScopeResult {
  const { persona, existing, next } = input;
  // Non-clinical AppRoles are rejected before this check; GP keeps full disposition rights.
  if (persona === null || persona === "gp") return { allowed: true };

  const statusChanged = existing.status !== next.status;
  const gatesDecided = newlyDecidedGates(existing, next);

  if (persona === "nurse") {
    if (statusChanged || gatesDecided.length > 0) {
      return {
        allowed: false,
        reason:
          "Nurse sessions may raise and observe, but the confirming Accept/Edit/Reject or gate decision belongs to the GP or pharmacist.",
      };
    }
    return { allowed: true };
  }

  // clinical-pharmacist
  const outOfScopeGate = gatesDecided.find((id) => !PHARMACIST_GATES.has(id));
  if (outOfScopeGate) {
    return {
      allowed: false,
      reason: `Pharmacist sessions may confirm the medication_decision gate only; ${outOfScopeGate} needs the GP.`,
    };
  }

  if (statusChanged) {
    const pendingGpGate = deriveHumanGates(next).find(
      (gate) => gate.status === "required" && !PHARMACIST_GATES.has(gate.id)
    );
    if (pendingGpGate) {
      return {
        allowed: false,
        reason: `Case disposition needs the GP while ${pendingGpGate.id} is still required.`,
      };
    }
  }

  return { allowed: true };
}

/** Pharmacist medication review (FLOW-JRN-2 `medication_decision`): pharmacist primary, GP co-accountable. */
export function canRecordMedicationReview(persona: ClinicalPersona | null): DecisionScopeResult {
  if (persona === "clinical-pharmacist" || persona === "gp") return { allowed: true };
  return {
    allowed: false,
    reason: "Only pharmacist or GP sessions may record a medication review.",
  };
}
