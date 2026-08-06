import type { DiabetesCoachingDraft, DiabetesPatientContext } from "./types";
import type { InsulinSignal } from "./insulin";

/**
 * Exercise Physiologist (diabetes spec area #6).
 *
 * Reuses the coaching-draft honesty contract from
 * lib/precision-health/coaching.ts (buildExerciseCoachingDraft) with
 * diabetes-specific resistance/cardio talking points and post-exercise
 * hypo-awareness framing.
 *
 * v1 (B3): base talking points stay static education content; an optional
 * Insulin hypo-risk signal personalises the priority ordering — never
 * inventing live wearable/CGM readings as clinical targets, still HITL-gated.
 */

export function buildExerciseDiabetesCoachingDraft(
  context: DiabetesPatientContext,
  signals?: { insulin?: InsulinSignal }
): DiabetesCoachingDraft {
  const patientLabel = context.patientLabel?.trim() || context.patientId;
  const suggestions = [
    "Share NHS / practice-approved activity guidelines appropriate to the patient's current condition profile",
    "Mention pre/post-exercise glucose-awareness talking points (clinician confirms individual thresholds)",
    "Do not invent live wearable step goals or CGM readings as clinical targets"
  ];
  if (signals?.insulin?.hypoRiskFlag) {
    suggestions.unshift(
      "Reported hypo event(s) on file — reinforce pre-exercise glucose-check timing talking point (clinician confirms individual thresholds)"
    );
  }

  return {
    moduleId: "EXERCISE",
    agentId: "EXERCISE_DIABETES",
    feedsInto: "coaching_surface",
    mode: "coaching_draft_only",
    patientId: context.patientId,
    patientLabel,
    title: "Diabetes exercise coaching draft (wellness)",
    summary:
      "General resistance/cardio activity talking points for wellness education — not a physiotherapy or exercise prescription.",
    suggestions,
    disclaimers: [
      "NOT CLINICAL ADVICE — coaching draft only.",
      "Does not replace physiotherapy, diabetes specialist nurse, or clinician exercise prescription.",
      "No EHR write; HITL required before any care-plan attachment."
    ],
    clinicalEscalationHints: [
      "Reported hypo symptoms during or after activity → clinician escalation (HITL)",
      "Chest pain, syncope, or new breathlessness on exertion → clinician escalation (HITL)"
    ],
    hitlRequired: true,
    ehrWrite: false,
    isClinicalAdvice: false,
    confidence: 0.4
  };
}
