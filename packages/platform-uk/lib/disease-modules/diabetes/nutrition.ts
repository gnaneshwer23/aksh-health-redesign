import type { DiabetesCoachingDraft, DiabetesPatientContext } from "./types";
import type { HbA1cSignal } from "./hba1c";

/**
 * Nutrition Scientist (diabetes spec area #5).
 *
 * Reuses the coaching-draft honesty contract from
 * lib/precision-health/coaching.ts (buildNutritionCoachingDraft) with
 * diabetes-specific talking points (glycaemic load, protein/fibre timing).
 * Surfaces on the patient-companion coaching surface, not the clinician
 * review queue, unless a clinicalEscalationHints trigger fires.
 *
 * v1 (B3): the base talking points stay static education content (not
 * fabricated per-patient advice), but an optional HbA1c-trend signal
 * personalises the priority ordering when a worsening trend is on file —
 * still `isClinicalAdvice: false`, still HITL-gated before any care-plan
 * attachment.
 */

export function buildNutritionDiabetesCoachingDraft(
  context: DiabetesPatientContext,
  signals?: { hba1c?: HbA1cSignal }
): DiabetesCoachingDraft {
  const patientLabel = context.patientLabel?.trim() || context.patientId;
  const suggestions = [
    "Offer glycaemic-load education materials approved by the practice",
    "Discuss protein/fibre-first meal ordering as a talking point (clinician confirms for an individual plan)",
    "Signpost to NHS / practice-approved diabetes diet resources only"
  ];
  if (signals?.hba1c?.trend === "worsening") {
    suggestions.unshift(
      "HbA1c trending upward on the record — prioritise a glycaemic-load talking point at the next contact (clinician confirms plan)"
    );
  }

  return {
    moduleId: "NUTRITION",
    agentId: "NUTRITION_DIABETES",
    feedsInto: "coaching_surface",
    mode: "coaching_draft_only",
    patientId: context.patientId,
    patientLabel,
    title: "Diabetes nutrition coaching draft (wellness)",
    summary:
      "General glycaemic-load and meal-timing talking points for patient education materials — not a clinical diet prescription.",
    suggestions,
    disclaimers: [
      "NOT CLINICAL ADVICE — coaching draft only.",
      "Does not replace dietitian or diabetes specialist nurse assessment.",
      "No EHR write; HITL required before any care-plan attachment."
    ],
    clinicalEscalationHints: [
      "Unintentional weight loss, disordered-eating signs, or a hypo pattern tied to meals → escalate to clinician (HITL)",
      "Renal or cardiac dietary restrictions → clinician / dietitian only"
    ],
    hitlRequired: true,
    ehrWrite: false,
    isClinicalAdvice: false,
    confidence: 0.4
  };
}
