import type { DiabetesHbA1cReading, DiabetesPatientContext, DiabetesSignalHonesty } from "./types";
import { DIABETES_SIGNAL_HONESTY } from "./types";
import type { DiabetesReadingsSource } from "./glucose";

/**
 * HbA1c Intelligence (diabetes spec area #2).
 *
 * Feeds HORIZON as a T2D contributing factor. "Predict" here means a
 * rules-based trend estimate over recorded lab values, NOT a claimed
 * diagnostic or clinical prediction — `isDiagnosticPrediction` is a hard
 * `false` literal.
 *
 * Data note: HbA1c already fits the existing `labSampleSchema` in
 * lib/precision-health/modalities.ts (arbitrary codeText/valueText) — no
 * schema change is required to store it, only to structure it as a series
 * (see DiabetesHbA1cReading in types.ts).
 *
 * v1 (B3): real rule-based trend derivation over the two most recent
 * supplied readings — a simple linear extrapolation (delta / months-between
 * * 3), not a regression model and not a v2 ML predictor. `readings` are
 * synthetic-fixture-supplied only (see fixtures.ts); no live lab feed exists.
 *
 * C6 (docs/PHASED_BUILD_PLAN_C.md, P1-2): `readings` may now come from a real
 * Patient State ingest (lib/disease-modules/diabetes/ingest.ts) — unlike
 * Glucose, HbA1c is NOT gated on OQ-DIAB-1 (it already fits the existing
 * `labSampleSchema`), so ingested readings flow straight through this same
 * real two-point trend derivation. The optional `readingsSource` parameter
 * stamps provenance so ingested and fixture-derived readings are never
 * silently blended without a visible tag.
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
  /** C6 (P1-2): where `readings` came from — never silently blended without this tag. */
  readingsSource: DiabetesReadingsSource;
  explanation: string[];
  limitations: string[];
} & DiabetesSignalHonesty;

/** Rule threshold: a change smaller than this (percentage points) between the two latest readings is "stable". */
const STABLE_BAND_PERCENT = 0.2;
/** Clamp a rule-based extrapolation to a plausible HbA1c range so a small sample never produces an implausible estimate. */
const PLAUSIBLE_MIN_PERCENT = 4;
const PLAUSIBLE_MAX_PERCENT = 15;

function monthsBetween(earlierIso: string, laterIso: string): number {
  const earlier = new Date(earlierIso).getTime();
  const later = new Date(laterIso).getTime();
  if (Number.isNaN(earlier) || Number.isNaN(later) || later <= earlier) return 0;
  return (later - earlier) / (1000 * 60 * 60 * 24 * 30.44);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function buildHbA1cSignal(
  context: DiabetesPatientContext,
  readings: DiabetesHbA1cReading[] = [],
  readingsSource: DiabetesReadingsSource = "fixture"
): HbA1cSignal {
  const patientLabel = context.patientLabel?.trim() || context.patientId;
  const sorted = [...readings].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );
  const latest = sorted.length ? sorted[sorted.length - 1] : null;

  if (!latest) {
    return {
      moduleId: "HBA1C",
      feedsInto: "HORIZON",
      patientId: context.patientId,
      patientLabel,
      latestValuePercent: null,
      trend: "insufficient_data",
      predictedNext3MonthsPercent: null,
      isDiagnosticPrediction: false,
      readingsSource,
      explanation: ["No HbA1c readings supplied — does not fabricate lab values."],
      limitations: [
        "No HbA1c readings available for this patient in the current fixture/data source.",
        "Any future estimate remains a non-diagnostic trend, never a clinical prediction."
      ],
      ...DIABETES_SIGNAL_HONESTY
    };
  }

  if (sorted.length === 1) {
    return {
      moduleId: "HBA1C",
      feedsInto: "HORIZON",
      patientId: context.patientId,
      patientLabel,
      latestValuePercent: latest.valuePercent,
      trend: "insufficient_data",
      predictedNext3MonthsPercent: null,
      isDiagnosticPrediction: false,
      readingsSource,
      explanation: [`Latest recorded HbA1c: ${latest.valuePercent}% — only one reading on file, trend needs ≥2.`],
      limitations: [
        "Only one HbA1c reading available — trend/3-month estimate needs at least two readings.",
        "Any future estimate remains a non-diagnostic trend, never a clinical prediction."
      ],
      ...DIABETES_SIGNAL_HONESTY
    };
  }

  const previous = sorted[sorted.length - 2];
  const delta = latest.valuePercent - previous.valuePercent;
  const trend: HbA1cTrend =
    delta <= -STABLE_BAND_PERCENT ? "improving" : delta >= STABLE_BAND_PERCENT ? "worsening" : "stable";

  const months = monthsBetween(previous.recordedAt, latest.recordedAt);
  const ratePerMonth = months > 0 ? delta / months : 0;
  const rawPrediction = latest.valuePercent + ratePerMonth * 3;
  const predictedNext3MonthsPercent =
    months > 0
      ? round1(Math.min(PLAUSIBLE_MAX_PERCENT, Math.max(PLAUSIBLE_MIN_PERCENT, rawPrediction)))
      : null;

  return {
    moduleId: "HBA1C",
    feedsInto: "HORIZON",
    patientId: context.patientId,
    patientLabel,
    latestValuePercent: latest.valuePercent,
    trend,
    predictedNext3MonthsPercent,
    isDiagnosticPrediction: false,
    readingsSource,
    explanation: [
      `Latest recorded HbA1c: ${latest.valuePercent}% (${previous.valuePercent}% → ${latest.valuePercent}% over ~${Math.round(months)} month(s)) — trend: ${trend}.`,
      predictedNext3MonthsPercent !== null
        ? `Non-diagnostic 3-month linear trend estimate: ${predictedNext3MonthsPercent}% — a rules-based extrapolation, not a clinical prediction.`
        : "3-month estimate not computed — reading dates too close together."
    ],
    limitations: [
      "Rule-based two-point linear extrapolation only — not a regression model, not a v2 ML predictor (see docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md v2 notes).",
      "Any estimate is a non-diagnostic trend, never a clinical prediction — clinician confirms wording before it reaches a patient-facing surface.",
      readingsSource === "patient_state_ingest"
        ? "Sourced from real Patient State ingest (C6) — still not a live lab feed integration."
        : "Synthetic-fixture data only — no live lab feed."
    ],
    ...DIABETES_SIGNAL_HONESTY
  };
}
