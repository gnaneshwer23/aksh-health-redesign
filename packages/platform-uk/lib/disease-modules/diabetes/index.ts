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

export {
  DIABETES_MODULE_IDS,
  DIABETES_MODULE_FEED_TARGET,
  DIABETES_SIGNAL_HONESTY,
  type DiabetesModuleId,
  type DiabetesFeedTarget,
  type DiabetesSignalHonesty,
  type DiabetesPatientContext,
  type DiabetesGlucoseReading,
  type DiabetesHbA1cReading,
  type DiabetesCoachingAgentId,
  type DiabetesCoachingDraft
} from "./types";

export { buildGlucoseSignal, type GlucoseSignal, type GlucosePatternFlag } from "./glucose";
export { buildHbA1cSignal, type HbA1cSignal, type HbA1cTrend } from "./hba1c";
export { buildInsulinSignal, type InsulinSignal, type InsulinRegimenSummary } from "./insulin";
export { buildGlp1Signal, type Glp1Signal } from "./glp1";
export { buildNutritionDiabetesCoachingDraft } from "./nutrition";
export { buildExerciseDiabetesCoachingDraft } from "./exercise";
export { buildBehaviourDiabetesCoachingDraft } from "./behaviour";
export {
  DIABETES_COMPLICATION_DOMAINS,
  buildComplicationSignal,
  type DiabetesComplicationDomain,
  type ComplicationFlagLevel,
  type ComplicationSignal
} from "./complications";
export { buildPreventionSignal, type PreventionSignal, type PreventionRiskTrajectory } from "./prevention";

export {
  DIABETES_DEMO_PATIENT,
  DIABETES_DEMO_GLUCOSE_READINGS,
  DIABETES_DEMO_HBA1C_READINGS,
  DIABETES_DEMO_INSULIN_REGIMEN,
  DIABETES_DEMO_GLP1_SIDE_EFFECTS
} from "./fixtures";

import type { DiabetesCoachingDraft, DiabetesPatientContext } from "./types";
import { buildGlucoseSignal, type GlucoseSignal } from "./glucose";
import { buildHbA1cSignal, type HbA1cSignal } from "./hba1c";
import { buildInsulinSignal, type InsulinSignal } from "./insulin";
import { buildGlp1Signal, type Glp1Signal } from "./glp1";
import { buildNutritionDiabetesCoachingDraft } from "./nutrition";
import { buildExerciseDiabetesCoachingDraft } from "./exercise";
import { buildBehaviourDiabetesCoachingDraft } from "./behaviour";
import {
  buildComplicationSignal,
  DIABETES_COMPLICATION_DOMAINS,
  type ComplicationSignal
} from "./complications";
import { buildPreventionSignal, type PreventionSignal } from "./prevention";

/**
 * Composite integration point (spec §"Composite integration: how 9 signals
 * become one contribution to HORIZON/GUARDIAN").
 *
 * One call site aggregating all 9 areas into the shape HORIZON and GUARDIAN
 * would consume — this is NOT a 10th agent, and it is not itself an agent
 * call (no AI Gateway request happens here; individual signal builders are
 * deterministic v0 stubs).
 *
 * v0: pure function, not called from any production route or orchestration
 * path. Exists so the aggregation shape can be reviewed before wiring.
 *
 * TODO(v1): call this from lib/clinical-spine/orchestrate.ts (or a helper it
 * invokes) for diabetes-flagged patients, behind a feature flag (e.g.
 * ENABLE_DIABETES_MODULE, default false, following the ENABLE_LLM_* /
 * ENABLE_FASTAPI_SYNTHESIS convention in lib/integration-config.ts). Merge
 * `horizonContributingFactors` into OracleDraft.contributingFactors
 * (lib/agents/llm-oracle.ts) and `guardianSafetyFlags` into
 * GuardianDraft.safetyNotes (lib/agents/llm-guardian.ts). SHIELD auditing and
 * HITL gating stay exactly as they are for HORIZON/GUARDIAN today — no new
 * audit path.
 */
export type DiabetesRiskContribution = {
  patientId: string;
  patientLabel: string;
  horizonContributingFactors: string[];
  guardianSafetyFlags: string[];
  coachingDrafts: DiabetesCoachingDraft[];
  signals: {
    glucose: GlucoseSignal;
    hba1c: HbA1cSignal;
    insulin: InsulinSignal;
    glp1: Glp1Signal;
    complications: ComplicationSignal[];
    prevention: PreventionSignal;
  };
  hitlRequired: true;
  ehrWrite: false;
  autoRetrain: false;
};

export function buildDiabetesRiskContribution(context: DiabetesPatientContext): DiabetesRiskContribution {
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
  ].filter((flag): flag is string => Boolean(flag));

  return {
    patientId: context.patientId,
    patientLabel: context.patientLabel?.trim() || context.patientId,
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
