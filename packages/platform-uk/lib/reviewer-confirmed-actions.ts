import { deriveHumanGates } from "./human-gates";
import type { HumanGateId, ReviewerDraftAction, ReviewCase, Severity } from "./types";

function actionStatusForGate(reviewCase: ReviewCase, gateId: HumanGateId) {
  const gateDecision = reviewCase.humanGateDecisions?.find((decision) => decision.id === gateId);

  return {
    status: gateDecision?.status === "confirmed" || gateDecision?.status === "not_applicable" ? "confirmed" as const : "open" as const,
    confirmationNote: gateDecision?.note,
    completedAt: gateDecision?.decidedAt,
    completedBy: gateDecision?.decidedBy
  };
}

function severityForGate(status: string, mandatory: boolean): Severity {
  if (status === "required" || mandatory) return "high";
  if (status === "recommended") return "medium";
  return "low";
}

function shouldShowGateAction(gate: { status: string; decision?: { status: string } }) {
  return gate.status === "required" || gate.status === "recommended" || gate.decision?.status === "confirmed";
}

export function deriveReviewerConfirmedActionDrafts(reviewCase: ReviewCase): ReviewerDraftAction[] {
  const gates = deriveHumanGates(reviewCase);
  const redFlagGate = gates.find((gate) => gate.id === "red_flag_escalation");
  const referralGate = gates.find((gate) => gate.id === "referral_pathway");
  const medicationGate = gates.find((gate) => gate.id === "medication_decision");
  const actions: ReviewerDraftAction[] = [];

  if (redFlagGate && shouldShowGateAction(redFlagGate)) {
    const gateStatus = actionStatusForGate(reviewCase, "red_flag_escalation");
    actions.push({
      id: `${reviewCase.id}-l9-safety-netting`,
      title: "L9 safety-netting decision draft",
      actionLabel: "Confirm safety-netting, urgent escalation, or same-day review handling.",
      instruction:
        "Reviewer must explicitly confirm the escalation/safety-netting decision before this synthetic case becomes accepted evidence.",
      category: "must_confirm",
      actionType: "safety_netting",
      severity: severityForGate(redFlagGate.status, redFlagGate.mandatory),
      ...gateStatus
    });
  }

  if (referralGate && shouldShowGateAction(referralGate)) {
    const gateStatus = actionStatusForGate(reviewCase, "referral_pathway");
    actions.push({
      id: `${reviewCase.id}-l9-referral-pathway`,
      title: "L9 referral/pathway decision draft",
      actionLabel: "Record whether the case remains in primary-care review or needs a pathway/referral action.",
      instruction:
        "Reviewer confirmation keeps pathway handling explicit and prevents the system from implying an autonomous referral decision.",
      category: "must_confirm",
      actionType: "referral_pathway",
      severity: severityForGate(referralGate.status, referralGate.mandatory),
      ...gateStatus
    });
  }

  if (medicationGate && shouldShowGateAction(medicationGate)) {
    const gateStatus = actionStatusForGate(reviewCase, "medication_decision");
    actions.push({
      id: `${reviewCase.id}-l9-medication-decision`,
      title: "L9 medication decision draft",
      actionLabel: "Confirm, edit, reject, or override the medication decision with reviewer rationale.",
      instruction:
        "Medication actions are reviewer-confirmed drafts only; this synthetic proof does not autonomously prescribe or integrate with live health system systems.",
      category: medicationGate.mandatory ? "override" : "must_confirm",
      actionType: "medication_decision",
      severity: severityForGate(medicationGate.status, medicationGate.mandatory),
      ...gateStatus
    });
  }

  return actions;
}
