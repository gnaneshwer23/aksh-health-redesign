import type { DiabetesPatientContext, DiabetesSignalHonesty } from "./types";
import { DIABETES_SIGNAL_HONESTY } from "./types";

/**
 * GLP-1 Intelligence (diabetes spec area #4).
 *
 * Structured talking points for clinician review — NOT a prescribing
 * recommendation. Feeds GUARDIAN (side-effect / interaction flag). Any
 * specialist-review trigger routes through the existing PATHWAY agent /
 * `referral_pathway` human gate, not a new gate type.
 *
 * `prescribingRecommendation` is a hard `null` literal, mirroring
 * insulin.ts's `doseChangeRecommendation` — this module never initiates or
 * changes a prescription.
 *
 * v1 (B3): real derivation over caller-supplied side-effect reports feeds
 * `sideEffectFlags` (see fixtures.ts). `suitabilitySignal`/`responseTrend`
 * stay the literal `"insufficient_data"` — a real suitability/response
 * estimate would need a weight/BMI trend input the cohort fixtures don't
 * carry yet; not fabricated in the meantime. Remains explanatory-only,
 * feeding GUARDIAN.
 */

export type Glp1Signal = {
  moduleId: "GLP1";
  feedsInto: "GUARDIAN";
  patientId: string;
  patientLabel: string;
  suitabilitySignal: "insufficient_data";
  responseTrend: "insufficient_data";
  sideEffectFlags: string[];
  /** Hard-locked: this module never proposes initiating or changing a GLP-1 prescription. */
  prescribingRecommendation: null;
  isPrescribingRecommendation: false;
  limitations: string[];
} & DiabetesSignalHonesty;

export function buildGlp1Signal(
  context: DiabetesPatientContext,
  reportedSideEffects: string[] = []
): Glp1Signal {
  const patientLabel = context.patientLabel?.trim() || context.patientId;

  return {
    moduleId: "GLP1",
    feedsInto: "GUARDIAN",
    patientId: context.patientId,
    patientLabel,
    suitabilitySignal: "insufficient_data",
    responseTrend: "insufficient_data",
    sideEffectFlags: reportedSideEffects,
    prescribingRecommendation: null,
    isPrescribingRecommendation: false,
    limitations: [
      "No suitability/response-trend modelling — would require a weight/BMI trend input not yet in the cohort fixtures.",
      "This module never initiates or changes a GLP-1 prescription; clinician review required via GUARDIAN.",
      reportedSideEffects.length
        ? `${reportedSideEffects.length} reported side-effect flag(s) supplied.`
        : "No reported side effects in supplied context."
    ],
    ...DIABETES_SIGNAL_HONESTY
  };
}
