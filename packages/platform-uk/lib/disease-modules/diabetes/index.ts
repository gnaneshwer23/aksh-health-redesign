/**
 * Diabetes Disease Intelligence — module barrel (v1, B3).
 *
 * Diabetes is the first Disease Intelligence module on the Aksh Intelligence
 * Platform (docs/ADR_AKSH_INTELLIGENCE_PLATFORM_LAYER_MAP.md, Layer 3). It is
 * a module, not a separate system: it reuses CONDUCTOR, SHIELD, HITL gates,
 * and the existing continuous-learning loop rather than introducing new
 * versions of any of them.
 *
 * v1 (B3) status: `buildDiabetesRiskContribution` is wired into
 * lib/clinical-spine/orchestrate.ts behind the `ENABLE_DIABETES_MODULE`
 * feature flag (default false) — see docs/PHASED_BUILD_PLAN.md B3. Nothing
 * here performs its own AI Gateway call (FR-DIAB-014); this composite is a
 * pure, synchronous, deterministic function.
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

import type { DiabetesReadingsSource } from "./glucose";

export {
  buildGlucoseSignal,
  type GlucoseSignal,
  type GlucosePatternFlag,
  type DiabetesReadingsSource
} from "./glucose";
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
// NOTE: intentionally NOT re-exporting ./learning here. recordDiabetesCoachingAccept
// transitively imports lib/repositories/learning-event-repository.ts (Node fs/pg) — this
// barrel is imported by client components (e.g. DiabetesPopulationSignal.tsx) via
// lib/precision-health/population-diabetes.ts, so pulling in a Node-only module here breaks
// the client bundle. Server-only call-sites must import from "./learning" directly.

export {
  DIABETES_DEMO_PATIENT,
  DIABETES_DEMO_GLUCOSE_READINGS,
  DIABETES_DEMO_HBA1C_READINGS,
  DIABETES_DEMO_INSULIN_REGIMEN,
  DIABETES_DEMO_GLP1_SIDE_EFFECTS,
  getDiabetesFixtureBundle,
  getDiabetesFixtureCohortIds,
  type DiabetesFixtureBundle
} from "./fixtures";

import type { DiabetesCoachingDraft, DiabetesModuleId, DiabetesPatientContext } from "./types";
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
import { getDiabetesFixtureBundle, type DiabetesFixtureBundle } from "./fixtures";

/**
 * OQ-DIAB-2 (this build plan's B3 label; Volume I's canonical id for this
 * exact question is OQ-DIAB-7 — Volume I's own OQ-DIAB-2 is the separate
 * Insulin/GLP-1 gate-type question, untouched by this decision) — DECIDED:
 * fail-open, per-area. If one area builder throws or returns malformed data,
 * the composite does NOT fail the whole contribution; it omits that area's
 * contribution to HORIZON/GUARDIAN, records which area failed in
 * `areaFailures`, and continues. Rationale: this composite is an additional
 * data-gathering step feeding an existing clinical draft path (HORIZON/
 * GUARDIAN) that must not itself become a new reason a clinician can't get a
 * draft — mirrors the "never hard-block a clinical action on an
 * infra/derivation hiccup" precedent this plan's B1 SHIELD fail-visible
 * design already established. A degraded area is always visible (via
 * `areaFailures`), never silently dropped.
 */
function safeBuildArea<T>(area: DiabetesModuleId, build: () => T, fallback: T): { value: T; failed: boolean } {
  try {
    return { value: build(), failed: false };
  } catch (error) {
    console.error(`[disease-modules/diabetes] ${area} builder failed — degrading gracefully (fail-open, OQ-DIAB-2/OQ-DIAB-7)`, error);
    return { value: fallback, failed: true };
  }
}

/**
 * Composite integration point (spec §"Composite integration: how 9 signals
 * become one contribution to HORIZON/GUARDIAN").
 *
 * One call site aggregating all 9 areas into the shape HORIZON and GUARDIAN
 * consume — this is NOT a 10th agent, and it is not itself an agent call (no
 * AI Gateway request happens here; every signal builder is a deterministic,
 * synchronous, rule-based function).
 *
 * Called from lib/clinical-spine/orchestrate.ts for diabetes-flagged
 * patients, behind ENABLE_DIABETES_MODULE (default false). Merge
 * `horizonContributingFactors` into OracleDraft.contributingFactors
 * (lib/agents/llm-oracle.ts) and `guardianSafetyFlags` into
 * GuardianDraft.safetyNotes (lib/agents/llm-guardian.ts) is done additively
 * by the caller. SHIELD auditing and HITL gating stay exactly as they are
 * for HORIZON/GUARDIAN today — no new audit path (FR-DIAB-016).
 *
 * `input` overrides the synthetic fixture lookup (getDiabetesFixtureBundle)
 * for tests/callers that want to supply data directly; omit it in
 * production wiring to use the cohort fixture keyed by `context.patientId`.
 *
 * C6 (docs/PHASED_BUILD_PLAN_C.md, P1-2): `readingsSource` lets a caller that
 * pre-loaded `input.glucoseReadings`/`input.hba1cReadings` from a real
 * Patient State ingest (lib/disease-modules/diabetes/ingest.ts — deliberately
 * NOT imported here, see that file's client-bundle-safety note) say so, so
 * the resulting signal is provenance-tagged rather than silently
 * indistinguishable from fixture data. Omitted (defaults to "fixture") for
 * every existing caller — byte-identical when nothing has been ingested yet.
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
  /** Areas that threw during derivation and were degraded gracefully (fail-open) — empty in the normal case. */
  areaFailures: DiabetesModuleId[];
  hitlRequired: true;
  ehrWrite: false;
  autoRetrain: false;
};

export function buildDiabetesRiskContribution(
  context: DiabetesPatientContext,
  input?: Partial<DiabetesFixtureBundle>,
  readingsSource?: { glucose?: DiabetesReadingsSource; hba1c?: DiabetesReadingsSource }
): DiabetesRiskContribution {
  const fixture = getDiabetesFixtureBundle(context.patientId);
  const bundle: DiabetesFixtureBundle = { ...fixture, ...input };
  const areaFailures: DiabetesModuleId[] = [];

  const glucoseResult = safeBuildArea(
    "GLUCOSE",
    () => buildGlucoseSignal(context, bundle.glucoseReadings, readingsSource?.glucose ?? "fixture"),
    null
  );
  const hba1cResult = safeBuildArea(
    "HBA1C",
    () => buildHbA1cSignal(context, bundle.hba1cReadings, readingsSource?.hba1c ?? "fixture"),
    null
  );
  const insulinResult = safeBuildArea("INSULIN", () => buildInsulinSignal(context, bundle.insulinRegimen), null);
  const glp1Result = safeBuildArea("GLP1", () => buildGlp1Signal(context, bundle.glp1SideEffects), null);
  const complicationsResult = safeBuildArea(
    "COMPLICATIONS",
    () =>
      DIABETES_COMPLICATION_DOMAINS.map((domain) =>
        buildComplicationSignal(context, domain, bundle.complicationEvidence?.[domain] ?? [])
      ),
    [] as ComplicationSignal[]
  );

  const glucose = glucoseResult.value ?? buildGlucoseSignal(context, []);
  const hba1c = hba1cResult.value ?? buildHbA1cSignal(context, []);
  const insulin = insulinResult.value ?? buildInsulinSignal(context);
  const glp1 = glp1Result.value ?? buildGlp1Signal(context);
  const complications = complicationsResult.value;

  if (glucoseResult.failed) areaFailures.push("GLUCOSE");
  if (hba1cResult.failed) areaFailures.push("HBA1C");
  if (insulinResult.failed) areaFailures.push("INSULIN");
  if (glp1Result.failed) areaFailures.push("GLP1");
  if (complicationsResult.failed) areaFailures.push("COMPLICATIONS");

  const preventionResult = safeBuildArea(
    "PREVENTION",
    () => buildPreventionSignal(context, { glucose, hba1c, complications }),
    buildPreventionSignal(context)
  );
  if (preventionResult.failed) areaFailures.push("PREVENTION");
  const prevention = preventionResult.value;

  const horizonContributingFactors: string[] = [
    ...glucose.limitations.map((limitation) => `Glucose: ${limitation}`),
    hba1c.latestValuePercent !== null
      ? `HbA1c: latest ${hba1c.latestValuePercent}% (trend: ${hba1c.trend})${
          hba1c.predictedNext3MonthsPercent !== null
            ? `, non-diagnostic 3-month trend estimate ${hba1c.predictedNext3MonthsPercent}%`
            : ""
        }`
      : `HbA1c: ${hba1c.limitations[0] ?? "no data on file"}`,
    ...complications
      .filter((c) => c.flagLevel !== "none")
      .map((c) => `Complications (${c.domain}): ${c.flagLevel} (${c.evidenceRefs.length} evidence ref(s))`),
    prevention.riskTrajectoryLabel !== "insufficient_data"
      ? `Prevention: risk trajectory ${prevention.riskTrajectoryLabel}`
      : `Prevention: ${prevention.limitations[0] ?? "insufficient data"}`
  ];

  const guardianSafetyFlags: string[] = [
    insulin.hypoRiskFlag ? "Insulin: reported hypo event(s) — clinician review recommended" : null,
    ...glp1.sideEffectFlags.map((flag) => `GLP-1: ${flag}`)
  ].filter((flag): flag is string => Boolean(flag));

  const nutritionDraft = safeBuildArea(
    "NUTRITION",
    () => buildNutritionDiabetesCoachingDraft(context, { hba1c }),
    buildNutritionDiabetesCoachingDraft(context)
  );
  if (nutritionDraft.failed) areaFailures.push("NUTRITION");

  const exerciseDraft = safeBuildArea(
    "EXERCISE",
    () => buildExerciseDiabetesCoachingDraft(context, { insulin }),
    buildExerciseDiabetesCoachingDraft(context)
  );
  if (exerciseDraft.failed) areaFailures.push("EXERCISE");

  const behaviourDraft = safeBuildArea(
    "BEHAVIOUR",
    () => buildBehaviourDiabetesCoachingDraft(context, { complications }),
    buildBehaviourDiabetesCoachingDraft(context)
  );
  if (behaviourDraft.failed) areaFailures.push("BEHAVIOUR");

  return {
    patientId: context.patientId,
    patientLabel: context.patientLabel?.trim() || context.patientId,
    horizonContributingFactors,
    guardianSafetyFlags,
    coachingDrafts: [nutritionDraft.value, exerciseDraft.value, behaviourDraft.value],
    signals: { glucose, hba1c, insulin, glp1, complications, prevention },
    areaFailures,
    hitlRequired: true,
    ehrWrite: false,
    autoRetrain: false
  };
}
