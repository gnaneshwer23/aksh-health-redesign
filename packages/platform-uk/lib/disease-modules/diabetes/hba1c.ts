import type { DiabetesHbA1cReading, DiabetesPatientContext, DiabetesSignalHonesty } from "./types";
import { DIABETES_SIGNAL_HONESTY } from "./types";

/**
 * HbA1c Intelligence (diabetes spec area #2).
 *
 * Feeds HORIZON as a T2D contributing factor. "Predict" here means a
 * rules/regression trend estimate over recorded lab values, NOT a claimed
 * diagnostic or clinical prediction — `isDiagnosticPrediction` is a hard
 * `false` literal.
 *
 * Data note: HbA1c already fits the existing `labSampleSchema` in
 * lib/precision-health/modalities.ts (arbitrary codeText/valueText) — no
 * schema change is required to store it, only to structure it as a series
 * (see DiabetesHbA1cReading in types.ts).
 *
 * v0: typed stub. Surfaces the latest supplied value only; no trend or
 * prediction logic yet.
 * TODO(v1): implement trend/prediction over `readings`; confirm UI wording
 * with clinical lead so a non-diagnostic estimate cannot be read as a
 * diagnosis (spec §"Open questions" #3).
 * TODO(v1): wire into lib/agents/llm-oracle.ts OracleDraft.contributingFactors
 * alongside glucose.ts, behind a feature flag, with a scenario test.
 */

export type HbA1cTrend = "insufficient_data" | "improving" | "stable" | "worsening";

export type HbA1cSignal = {
  moduleId: "HBA1C";
  feedsInto: "HORIZON";
  patientId: string;
  patientLabel: string;
  latestValuePercent: number | null;
  trend: HbA1cTrend;
  /** Non-diagnostic trend estimate only. Never presented as a diagnosis or clinical prediction. */
  predictedNext3MonthsPercent: number | null;
  isDiagnosticPrediction: false;
  explanation: string[];
  limitations: string[];
} & DiabetesSignalHonesty;

export function buildHbA1cSignal(
  context: DiabetesPatientContext,
  readings: DiabetesHbA1cReading[] = []
): HbA1cSignal {
  const patientLabel = context.patientLabel?.trim() || context.patientId;
  const latest = readings.length ? readings[readings.length - 1] : null;

  return {
    moduleId: "HBA1C",
    feedsInto: "HORIZON",
    patientId: context.patientId,
    patientLabel,
    latestValuePercent: latest?.valuePercent ?? null,
    trend: "insufficient_data",
    predictedNext3MonthsPercent: null,
    isDiagnosticPrediction: false,
    explanation: latest
      ? [`Latest recorded HbA1c: ${latest.valuePercent}% — v0 stub does not compute a trend yet.`]
      : ["No HbA1c readings supplied — v0 stub does not fabricate lab values."],
    limitations: [
      "Trend / 3-month estimate derivation deferred to v1 (docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md).",
      "Any future estimate remains a non-diagnostic trend, never a clinical prediction — wording pending clinical lead sign-off."
    ],
    ...DIABETES_SIGNAL_HONESTY
  };
}
