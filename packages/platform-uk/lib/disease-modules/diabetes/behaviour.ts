import type { DiabetesCoachingDraft, DiabetesPatientContext } from "./types";

/**
 * Behaviour Scientist (diabetes spec area #7).
 *
 * Reuses the coaching-draft honesty contract from
 * lib/precision-health/coaching.ts (buildMentalHealthCoachingDraft) with
 * diabetes-specific habit/adherence/diabetes-distress framing. Any disclosed
 * risk escalates via clinicalEscalationHints to a human gate — never handled
 * autonomously.
 *
 * TODO(open question — spec §"Open questions" #6, needs clinical lead input):
 * confirm the specific self-report screening signal(s) (e.g. a diabetes
 * distress screening tool) that should trigger the escalation path below —
 * the wording here is a conservative placeholder, not a validated screen.
 *
 * v0: static talking-points draft. No adherence-pattern derivation yet.
 * TODO(v1): incorporate medication refill / adherence signals if a data
 * source is confirmed.
 */

export function buildBehaviourDiabetesCoachingDraft(context: DiabetesPatientContext): DiabetesCoachingDraft {
  const patientLabel = context.patientLabel?.trim() || context.patientId;

  return {
    moduleId: "BEHAVIOUR",
    agentId: "BEHAVIOUR_DIABETES",
    feedsInto: "coaching_surface",
    mode: "coaching_draft_only",
    patientId: context.patientId,
    patientLabel,
    title: "Diabetes behaviour coaching draft (wellness)",
    summary:
      "General habit, adherence, and motivation talking points for wellness education — not a psychological assessment or therapy plan.",
    suggestions: [
      "Offer habit-tracking talking points for medication/monitoring routines",
      "Signpost to practice-approved diabetes education / peer-support programmes",
      "Never claim a diagnosis of diabetes distress or a mental-health condition from this stub"
    ],
    disclaimers: [
      "NOT CLINICAL ADVICE — coaching draft only.",
      "Does not diagnose diabetes distress, depression, anxiety, or other conditions.",
      "No EHR write; HITL required before any care-plan attachment."
    ],
    clinicalEscalationHints: [
      "Reported diabetes distress, burnout, or disengagement from self-management → clinician escalation (HITL); exact screening trigger pending clinical lead sign-off",
      "Suicidal ideation, self-harm, or acute crisis → immediate clinician / emergency path (HITL)"
    ],
    hitlRequired: true,
    ehrWrite: false,
    isClinicalAdvice: false,
    confidence: 0.35
  };
}
