/**
 * Diabetes Disease Intelligence — module barrel (v0 stub).
 *
 * Diabetes is the first Disease Intelligence module on the Aksh Intelligence
 * Platform (docs/ADR_AKSH_INTELLIGENCE_PLATFORM_LAYER_MAP.md, Layer 3). It is
 * a module, not a separate system: it reuses CONDUCTOR, SHIELD, HITL gates,
 * and the existing continuous-learning loop rather than introducing new
 * versions of any of them.
 *
 * v0 status: nothing exported here is called from
 * lib/clinical-spine/orchestrate.ts, lib/agents/llm-oracle.ts, or
 * lib/agents/llm-guardian.ts yet. `buildDiabetesRiskContribution` below is
 * the proposed v1 integration point — see its TODO for the exact wiring
 * step, which should land as its own reviewed change with a scenario test.
 */
export { DIABETES_MODULE_IDS, DIABETES_MODULE_FEED_TARGET, DIABETES_SIGNAL_HONESTY } from "./types";
export { buildGlucoseSignal } from "./glucose";
export { buildHbA1cSignal } from "./hba1c";
export { buildInsulinSignal } from "./insulin";
export { buildGlp1Signal } from "./glp1";
export { buildNutritionDiabetesCoachingDraft } from "./nutrition";
export { buildExerciseDiabetesCoachingDraft } from "./exercise";
export { buildBehaviourDiabetesCoachingDraft } from "./behaviour";
export { DIABETES_COMPLICATION_DOMAINS, buildComplicationSignal } from "./complications";
export { buildPreventionSignal } from "./prevention";
export { DIABETES_DEMO_PATIENT, DIABETES_DEMO_GLUCOSE_READINGS, DIABETES_DEMO_HBA1C_READINGS, DIABETES_DEMO_INSULIN_REGIMEN, DIABETES_DEMO_GLP1_SIDE_EFFECTS } from "./fixtures";
import { buildGlucoseSignal } from "./glucose";
import { buildHbA1cSignal } from "./hba1c";
import { buildInsulinSignal } from "./insulin";
import { buildGlp1Signal } from "./glp1";
import { buildNutritionDiabetesCoachingDraft } from "./nutrition";
import { buildExerciseDiabetesCoachingDraft } from "./exercise";
import { buildBehaviourDiabetesCoachingDraft } from "./behaviour";
import { buildComplicationSignal, DIABETES_COMPLICATION_DOMAINS } from "./complications";
import { buildPreventionSignal } from "./prevention";
export function buildDiabetesRiskContribution(context) {
    var _a;
    const glucose = buildGlucoseSignal(context);
    const hba1c = buildHbA1cSignal(context);
    const insulin = buildInsulinSignal(context);
    const glp1 = buildGlp1Signal(context);
    const complications = DIABETES_COMPLICATION_DOMAINS.map((domain) => buildComplicationSignal(context, domain));
    const prevention = buildPreventionSignal(context, { glucose, hba1c, complications });
    const horizonContributingFactors = [
        ...glucose.limitations.map((limitation) => `Glucose: ${limitation}`),
        ...hba1c.limitations.map((limitation) => `HbA1c: ${limitation}`)
    ];
    const guardianSafetyFlags = [
        insulin.hypoRiskFlag ? "Insulin: reported hypo event(s) — clinician review recommended" : null,
        ...glp1.sideEffectFlags
    ].filter((flag) => Boolean(flag));
    return {
        patientId: context.patientId,
        patientLabel: ((_a = context.patientLabel) === null || _a === void 0 ? void 0 : _a.trim()) || context.patientId,
        horizonContributingFactors,
        guardianSafetyFlags,
        coachingDrafts: [
            buildNutritionDiabetesCoachingDraft(context),
            buildExerciseDiabetesCoachingDraft(context),
            buildBehaviourDiabetesCoachingDraft(context)
        ],
        signals: { glucose, hba1c, insulin, glp1, complications, prevention },
        hitlRequired: true,
        ehrWrite: false,
        autoRetrain: false
    };
}
