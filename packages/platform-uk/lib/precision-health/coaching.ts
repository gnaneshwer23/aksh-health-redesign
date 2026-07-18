/**
 * Nutrition & Sleep coaching drafts — low-risk wellness path under HITL.
 * Explicitly not clinical advice. Escalations require clinician review.
 */

export type CoachingAgentId = "NUTRITION" | "SLEEP";

export type CoachingDraft = {
  agentId: CoachingAgentId;
  mode: "coaching_draft_only";
  patientId: string;
  patientLabel: string;
  title: string;
  summary: string;
  suggestions: string[];
  disclaimers: string[];
  clinicalEscalationHints: string[];
  hitlRequired: true;
  ehrWrite: false;
  isClinicalAdvice: false;
  confidence: number;
};

export function buildNutritionCoachingDraft(options: {
  patientId: string;
  patientLabel?: string;
  contextNotes?: string;
}): CoachingDraft {
  const patientLabel = options.patientLabel?.trim() || options.patientId;
  return {
    agentId: "NUTRITION",
    mode: "coaching_draft_only",
    patientId: options.patientId,
    patientLabel,
    title: "Nutrition coaching draft (wellness)",
    summary:
      options.contextNotes?.trim() ||
      "General wellness nutrition talking points for patient education materials — not a clinical diet prescription.",
    suggestions: [
      "Offer plate-method education materials approved by the practice",
      "Encourage fluid and salt awareness talking points if HF pathway is active (clinician must confirm)",
      "Signpost to NHS / practice-approved diet resources only"
    ],
    disclaimers: [
      "NOT CLINICAL ADVICE — coaching draft only.",
      "Does not replace dietitian or clinician assessment.",
      "No EHR write; HITL required before any care-plan attachment."
    ],
    clinicalEscalationHints: [
      "Unintentional weight loss, dysphagia, or malnutrition risk → escalate to clinician (HITL)",
      "Renal / HF dietary restrictions → clinician / dietitian only"
    ],
    hitlRequired: true,
    ehrWrite: false,
    isClinicalAdvice: false,
    confidence: 0.4
  };
}

export function buildSleepCoachingDraft(options: {
  patientId: string;
  patientLabel?: string;
  contextNotes?: string;
}): CoachingDraft {
  const patientLabel = options.patientLabel?.trim() || options.patientId;
  return {
    agentId: "SLEEP",
    mode: "coaching_draft_only",
    patientId: options.patientId,
    patientLabel,
    title: "Sleep coaching draft (wellness)",
    summary:
      options.contextNotes?.trim() ||
      "General sleep-hygiene talking points for wellness education — not a sleep-disorder diagnosis.",
    suggestions: [
      "Share sleep-hygiene checklist (consistent schedule, caffeine timing, screen curfew)",
      "Suggest sleep diary for clinician review if symptoms persist",
      "Avoid claiming wearable sleep-stage accuracy — Phase 1 has no live wearable stream"
    ],
    disclaimers: [
      "NOT CLINICAL ADVICE — coaching draft only.",
      "Does not diagnose insomnia, OSA, or other sleep disorders.",
      "No EHR write; HITL required before any care-plan attachment."
    ],
    clinicalEscalationHints: [
      "Witnessed apnoeas, refractory daytime somnolence, or chest pain at night → clinician escalation (HITL)",
      "Medication-related sedation concerns → GUARDIAN / clinician path"
    ],
    hitlRequired: true,
    ehrWrite: false,
    isClinicalAdvice: false,
    confidence: 0.4
  };
}
