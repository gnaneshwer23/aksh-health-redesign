import type { DiabetesCoachingDraft, DiabetesPatientContext } from "./types";
import type { ComplicationSignal } from "./complications";

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
 * v1 (B3): base talking points stay static education content (no medication
 * refill/adherence data source is confirmed yet); an optional Complications
 * signal personalises the priority ordering toward adherence-support framing
 * when a referral-indicated complication is on file.
 */

export function buildBehaviourDiabetesCoachingDraft(
  context: DiabetesPatientContext,
  signals?: { complications?: ComplicationSignal[] }
): DiabetesCoachingDraft {
  const patientLabel = context.patientLabel?.trim() || context.patientId;
  const anyReferralIndicated = (signals?.complications ?? []).some((c) => c.flagLevel === "referral_indicated");
  const suggestions = [
    "Offer habit-tracking talking points for medication/monitoring routines",
    "Signpost to practice-approved diabetes education / peer-support programmes",
    "Never claim a diagnosis of diabetes distress or a mental-health condition from this stub"
  ];
  if (anyReferralIndicated) {
    suggestions.unshift(
      "A complication flag is under clinician review — reinforce adherence-support talking points alongside it (not a substitute for the clinical review itself)"
    );
  }

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
    suggestions,
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
