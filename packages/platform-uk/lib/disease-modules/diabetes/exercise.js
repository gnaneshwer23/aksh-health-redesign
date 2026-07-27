/**
 * Exercise Physiologist (diabetes spec area #6).
 *
 * Reuses the coaching-draft honesty contract from
 * lib/precision-health/coaching.ts (buildExerciseCoachingDraft) with
 * diabetes-specific resistance/cardio talking points and post-exercise
 * hypo-awareness framing.
 *
 * v0: static talking-points draft. No personalisation from activity/glucose
 * data yet.
 * TODO(v1): personalise using activityMinutesPerWeek (lifestyle modality) and
 * GlucoseSignal (glucose.ts) for post-exercise hypo-risk timing notes.
 */
export function buildExerciseDiabetesCoachingDraft(context) {
    var _a;
    const patientLabel = ((_a = context.patientLabel) === null || _a === void 0 ? void 0 : _a.trim()) || context.patientId;
    return {
        moduleId: "EXERCISE",
        agentId: "EXERCISE_DIABETES",
        feedsInto: "coaching_surface",
        mode: "coaching_draft_only",
        patientId: context.patientId,
        patientLabel,
        title: "Diabetes exercise coaching draft (wellness)",
        summary: "General resistance/cardio activity talking points for wellness education — not a physiotherapy or exercise prescription.",
        suggestions: [
            "Share NHS / practice-approved activity guidelines appropriate to the patient's current condition profile",
            "Mention pre/post-exercise glucose-awareness talking points (clinician confirms individual thresholds)",
            "Do not invent live wearable step goals or CGM readings as clinical targets"
        ],
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
