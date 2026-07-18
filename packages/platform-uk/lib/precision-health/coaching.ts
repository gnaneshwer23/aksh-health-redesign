/**
 * Coaching drafts — low-risk wellness path under HITL.
 * Nutrition, Sleep, Exercise, Mental-health stubs.
 * Explicitly not clinical advice. Escalations require clinician review.
 */

export type CoachingAgentId = "NUTRITION" | "SLEEP" | "EXERCISE" | "MENTAL_HEALTH";

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
      "Avoid claiming wearable sleep-stage accuracy — no invented live wearable stream"
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

export function buildExerciseCoachingDraft(options: {
  patientId: string;
  patientLabel?: string;
  contextNotes?: string;
}): CoachingDraft {
  const patientLabel = options.patientLabel?.trim() || options.patientId;
  return {
    agentId: "EXERCISE",
    mode: "coaching_draft_only",
    patientId: options.patientId,
    patientLabel,
    title: "Exercise coaching draft (wellness)",
    summary:
      options.contextNotes?.trim() ||
      "General physical-activity talking points for wellness education — not a cardiac rehab or physio prescription.",
    suggestions: [
      "Share NHS / practice-approved activity guidelines appropriate to age band",
      "Encourage gradual build and seated options if mobility limited (clinician confirms)",
      "Do not invent live wearable step goals as clinical targets"
    ],
    disclaimers: [
      "NOT CLINICAL ADVICE — coaching draft only.",
      "Does not replace physiotherapy, cardiac rehab, or clinician exercise prescription.",
      "No EHR write; HITL required before any care-plan attachment."
    ],
    clinicalEscalationHints: [
      "Chest pain, syncope, or new breathlessness on exertion → clinician escalation (HITL)",
      "Post-op / HF / fall-risk activity limits → clinician / physio only"
    ],
    hitlRequired: true,
    ehrWrite: false,
    isClinicalAdvice: false,
    confidence: 0.4
  };
}

export function buildMentalHealthCoachingDraft(options: {
  patientId: string;
  patientLabel?: string;
  contextNotes?: string;
}): CoachingDraft {
  const patientLabel = options.patientLabel?.trim() || options.patientId;
  return {
    agentId: "MENTAL_HEALTH",
    mode: "coaching_draft_only",
    patientId: options.patientId,
    patientLabel,
    title: "Mental-health coaching draft (wellness)",
    summary:
      options.contextNotes?.trim() ||
      "General wellbeing talking points and signposting — not a psychiatric assessment or therapy plan.",
    suggestions: [
      "Signpost to practice-approved IAPT / NHS Talking Therapies resources only",
      "Offer sleep/activity wellness crosstalk where appropriate (still coaching-only)",
      "Never claim crisis management or diagnosis from this stub"
    ],
    disclaimers: [
      "NOT CLINICAL ADVICE — coaching draft only.",
      "Does not diagnose depression, anxiety, or other mental-health conditions.",
      "No EHR write; HITL required before any care-plan attachment."
    ],
    clinicalEscalationHints: [
      "Suicidal ideation, self-harm, or acute crisis → immediate clinician / emergency path (HITL)",
      "Medication side-effects affecting mood → GUARDIAN / clinician path"
    ],
    hitlRequired: true,
    ehrWrite: false,
    isClinicalAdvice: false,
    confidence: 0.35
  };
}
