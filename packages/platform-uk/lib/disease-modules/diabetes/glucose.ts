import type { DiabetesGlucoseReading, DiabetesPatientContext, DiabetesSignalHonesty } from "./types";
import { DIABETES_SIGNAL_HONESTY } from "./types";

/**
 * Glucose Intelligence (diabetes spec area #1).
 *
 * Feeds HORIZON as a contributing-factor category alongside existing CVD/T2D
 * factors (lib/agents/llm-oracle.ts). Does NOT derive a GUARDIAN safety flag
 * on its own — hypoglycaemia flags are the responsibility of insulin.ts /
 * glp1.ts, which may combine glucose patterns with regimen data.
 *
 * v0: typed stub. Returns an honest "insufficient data" result — never
 * fabricates CGM/BGM patterns from nothing.
 * TODO(v1): implement real TIR / variability / pattern-flag derivation once
 * glucose readings have a confirmed data source (see types.ts
 * DiabetesGlucoseReading, spec §"Data sources", open question #1).
 * TODO(v1): wire buildGlucoseSignal() output into
 * lib/agents/llm-oracle.ts OracleDraft.contributingFactors behind a feature
 * flag, with a scenario test, before any production exposure.
 */

export type GlucosePatternFlag =
  | "dawn_phenomenon_suspected"
  | "post_prandial_spike_suspected"
  | "nocturnal_hypo_suspected"
  | "insufficient_data";

export type GlucoseSignal = {
  moduleId: "GLUCOSE";
  feedsInto: "HORIZON";
  patientId: string;
  patientLabel: string;
  tirPercent: number | null;
  variabilityScore: number | null;
  patternFlags: GlucosePatternFlag[];
  dataCompleteness: "none" | "partial" | "sufficient";
  limitations: string[];
} & DiabetesSignalHonesty;

export function buildGlucoseSignal(
  context: DiabetesPatientContext,
  readings: DiabetesGlucoseReading[] = []
): GlucoseSignal {
  const patientLabel = context.patientLabel?.trim() || context.patientId;

  if (readings.length === 0) {
    return {
      moduleId: "GLUCOSE",
      feedsInto: "HORIZON",
      patientId: context.patientId,
      patientLabel,
      tirPercent: null,
      variabilityScore: null,
      patternFlags: ["insufficient_data"],
      dataCompleteness: "none",
      limitations: [
        "No glucose readings supplied — v0 stub does not fabricate CGM/BGM data.",
        "TIR / variability / pattern derivation deferred to v1 (docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md)."
      ],
      ...DIABETES_SIGNAL_HONESTY
    };
  }

  return {
    moduleId: "GLUCOSE",
    feedsInto: "HORIZON",
    patientId: context.patientId,
    patientLabel,
    tirPercent: null,
    variabilityScore: null,
    patternFlags: ["insufficient_data"],
    dataCompleteness: "partial",
    limitations: [
      `${readings.length} reading(s) received — v0 stub does not yet compute TIR/variability/patterns.`,
      "Real derivation deferred to v1."
    ],
    ...DIABETES_SIGNAL_HONESTY
  };
}
