/**
 * Nutrition Scientist (diabetes spec area #5).
 *
 * Reuses the coaching-draft honesty contract from
 * lib/precision-health/coaching.ts (buildNutritionCoachingDraft) with
 * diabetes-specific talking points (glycaemic load, protein/fibre timing).
 * Surfaces on the patient-companion coaching surface, not the clinician
 * review queue, unless a clinicalEscalationHints trigger fires.
 *
 * v0: static talking-points draft. No personalisation from glucose/nutrition
 * log data yet.
 * TODO(v1): personalise suggestions using GlucoseSignal (glucose.ts) and any
 * confirmed meal-log modality.
 */
export function buildNutritionDiabetesCoachingDraft(context) {
    var _a;
    const patientLabel = ((_a = context.patientLabel) === null || _a === void 0 ? void 0 : _a.trim()) || context.patientId;
    return {
        moduleId: "NUTRITION",
        agentId: "NUTRITION_DIABETES",
        feedsInto: "coaching_surface",
        mode: "coaching_draft_only",
        patientId: context.patientId,
        patientLabel,
        title: "Diabetes nutrition coaching draft (wellness)",
        summary: "General glycaemic-load and meal-timing talking points for patient education materials — not a clinical diet prescription.",
        suggestions: [
            "Offer glycaemic-load education materials approved by the practice",
            "Discuss protein/fibre-first meal ordering as a talking point (clinician confirms for an individual plan)",
            "Signpost to NHS / practice-approved diabetes diet resources only"
        ],
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
