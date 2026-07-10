import type { HumanGateDecision, HumanGateId, ReviewCase, SafetyFlag } from "./types";
import { deriveSafetyFlags } from "./workflow/safety";

export type { HumanGateDecision, HumanGateId } from "./types";

export type HumanGateStatus = "clear" | "recommended" | "required" | "completed";

export type HumanGate = {
  id: HumanGateId;
  label: string;
  status: HumanGateStatus;
  mandatory: boolean;
  reason: string;
  reviewerAction: string;
  evidence: string[];
  decision?: HumanGateDecision;
};

function hasFlag(flags: SafetyFlag[], suffix: string) {
  return flags.some((flag) => flag.id.endsWith(suffix));
}

function evidenceFor(flags: SafetyFlag[], suffixes: string[]) {
  return flags.filter((flag) => suffixes.some((suffix) => flag.id.endsWith(suffix))).map((flag) => flag.detail);
}

function normalize(value: string | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function decisionFor(reviewCase: ReviewCase, id: HumanGateId) {
  return reviewCase.humanGateDecisions?.find((decision) => decision.id === id);
}

function gateStatus(baseStatus: HumanGateStatus, decision: HumanGateDecision | undefined): HumanGateStatus {
  if (decision?.status === "confirmed" || decision?.status === "not_applicable") {
    return "completed";
  }

  return baseStatus;
}

function gateDecisionLabel(decision: HumanGateDecision | undefined) {
  if (!decision) return "No explicit gate decision recorded yet.";
  if (decision.status === "confirmed") return "Reviewer confirmed this gate.";
  if (decision.status === "not_applicable") return "Reviewer marked this gate as not applicable.";
  return "Gate remains open.";
}

export function deriveHumanGates(reviewCase: ReviewCase): HumanGate[] {
  const flags = deriveSafetyFlags(reviewCase);
  const hasRespiratoryEscalation = hasFlag(flags, "-respiratory-escalation");
  const hasMedicationRisk =
    hasFlag(flags, "-allergy") ||
    hasFlag(flags, "-intolerance") ||
    hasFlag(flags, "-ddi") ||
    hasFlag(flags, "-confidence");
  const hasMedicationDraft = Boolean(reviewCase.draft.medicationRequest?.medicationText);
  const sourceSummary = normalize(reviewCase.input.summary);
  const condition = normalize(reviewCase.draft.condition.codeText);
  const suggestsReferral =
    hasRespiratoryEscalation ||
    sourceSummary.includes("refer") ||
    sourceSummary.includes("urgent") ||
    condition.includes("lower respiratory") ||
    condition.includes("chest pain");
  const redFlagDecision = decisionFor(reviewCase, "red_flag_escalation");
  const referralDecision = decisionFor(reviewCase, "referral_pathway");
  const medicationDecision = decisionFor(reviewCase, "medication_decision");

  const redFlagBaseStatus: HumanGateStatus = hasRespiratoryEscalation ? "required" : "clear";
  const referralBaseStatus: HumanGateStatus = suggestsReferral ? (hasRespiratoryEscalation ? "required" : "recommended") : "clear";
  const medicationBaseStatus: HumanGateStatus = hasMedicationRisk ? "required" : hasMedicationDraft ? "recommended" : "clear";
  const redFlagStatus = gateStatus(redFlagBaseStatus, redFlagDecision);
  const referralStatus = gateStatus(referralBaseStatus, referralDecision);
  const medicationStatus = gateStatus(medicationBaseStatus, medicationDecision);

  return [
    {
      id: "red_flag_escalation",
      label: "Red-flag escalation gate",
      status: redFlagStatus,
      mandatory: redFlagStatus === "required",
      reason: hasRespiratoryEscalation
        ? "Source evidence contains fever with wheeze or breathlessness, so escalation must be explicitly confirmed."
        : "No red-flag escalation signal is currently derived from the synthetic source input.",
      reviewerAction: `${gateDecisionLabel(redFlagDecision)} Confirm whether urgent escalation, same-day review, or safety-netting is required before finalization.`,
      evidence: evidenceFor(flags, ["-respiratory-escalation"]),
      decision: redFlagDecision
    },
    {
      id: "referral_pathway",
      label: "Referral/pathway gate",
      status: referralStatus,
      mandatory: referralStatus === "required",
      reason: suggestsReferral
        ? "The case may need an explicit pathway decision because escalation, urgent language, or respiratory lower-tract evidence is present."
        : "No referral or pathway escalation trigger is currently derived.",
      reviewerAction: `${gateDecisionLabel(referralDecision)} Record whether the case stays in primary-care review, needs referral, or needs another pathway action.`,
      evidence: hasRespiratoryEscalation
        ? evidenceFor(flags, ["-respiratory-escalation"])
        : [reviewCase.draft.condition.evidence || reviewCase.summary].filter(Boolean),
      decision: referralDecision
    },
    {
      id: "medication_decision",
      label: "Medication/decision gate",
      status: medicationStatus,
      mandatory: medicationStatus === "required",
      reason: hasMedicationRisk
        ? "Medication safety, allergy, intolerance, interaction, or low-confidence extraction requires explicit clinician confirmation."
        : hasMedicationDraft
          ? "A medication draft is present and should be confirmed even when no high-risk flag is derived."
          : "No medication draft is currently present.",
      reviewerAction: `${gateDecisionLabel(medicationDecision)} Confirm, edit, reject, or override the medication decision with a documented rationale.`,
      evidence: hasMedicationRisk
        ? evidenceFor(flags, ["-allergy", "-intolerance", "-ddi", "-confidence"])
        : [reviewCase.draft.medicationRequest?.medicationText].filter(Boolean) as string[],
      decision: medicationDecision
    }
  ];
}

export function summarizeHumanGates(reviewCase: ReviewCase) {
  const gates = deriveHumanGates(reviewCase);

  return {
    caseId: reviewCase.id,
    required: gates.filter((gate) => gate.status === "required").length,
    recommended: gates.filter((gate) => gate.status === "recommended").length,
    completed: gates.filter((gate) => gate.status === "completed").length,
    clear: gates.filter((gate) => gate.status === "clear").length,
    gates
  };
}

export function createHumanGateDecision({
  id,
  status,
  note,
  decidedAt,
  decidedBy
}: HumanGateDecision): HumanGateDecision {
  return {
    id,
    status,
    note,
    decidedAt,
    decidedBy
  };
}

export function ensureHumanGateDecisionSnapshot(
  reviewCase: ReviewCase,
  options: { decidedAt: string; decidedBy: string }
): HumanGateDecision[] {
  const existing = new Map((reviewCase.humanGateDecisions ?? []).map((decision) => [decision.id, decision]));

  return deriveHumanGates(reviewCase).map((gate) => {
    const persisted = existing.get(gate.id);

    if (persisted) {
      return persisted;
    }

    return createHumanGateDecision({
      id: gate.id,
      status: gate.status === "clear" ? "not_applicable" : "open",
      decidedAt: options.decidedAt,
      decidedBy: options.decidedBy
    });
  });
}
