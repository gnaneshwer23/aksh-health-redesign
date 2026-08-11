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
 * B3 status (checked against `docs/PHASED_BUILD_PLAN.md` B3's blocking
 * decision gate): OQ-DIAB-1 (CGM/glucose modality schema — extend
 * `wearableSampleSchema` vs. a new `glucose` modality in
 * lib/precision-health/modalities.ts) is still OPEN — no clinical-lead
 * decision has been recorded. Per the plan, this phase does not proceed past
 * that gate for Glucose: this module stays an honest "insufficient data"
 * stub and is NOT given real TIR/variability/pattern derivation in B3. It is
 * still wired into the composite (`index.ts`) and into HORIZON via its
 * `limitations` array — so the "no CGM data yet" state itself is visible to
 * the clinician, rather than the module being silently absent — but it
 * never fabricates a pattern from nothing. Re-open this file once OQ-DIAB-1
 * is decided (targeted v1.1, see PHASED_BUILD_PLAN.md B3 completion note).
 *
 * C6 (docs/PHASED_BUILD_PLAN_C.md, P1-2): `readings` may now come from a
 * real Patient State ingest (lib/disease-modules/diabetes/ingest.ts) instead
 * of the static fixture bundle — the optional `readingsSource` parameter
 * lets the caller (index.ts's composite) stamp which one, so ingested and
 * fixture-derived readings are never silently blended without a visible
 * provenance tag. This does NOT change what this function derives: TIR /
 * variability / pattern computation stays `insufficient_data` either way,
 * pending the still-open OQ-DIAB-1 modality decision — ingestion only
 * changes *how many* readings are on file, never what is computed from them.
 */

export type GlucosePatternFlag =
  | "dawn_phenomenon_suspected"
  | "post_prandial_spike_suspected"
  | "nocturnal_hypo_suspected"
  | "insufficient_data";

export type DiabetesReadingsSource = "fixture" | "patient_state_ingest";

export type GlucoseSignal = {
  moduleId: "GLUCOSE";
  feedsInto: "HORIZON";
  patientId: string;
  patientLabel: string;
  tirPercent: number | null;
  variabilityScore: number | null;
  patternFlags: GlucosePatternFlag[];
  dataCompleteness: "none" | "partial" | "sufficient";
  /** C6 (P1-2): where `readings` came from — never silently blended without this tag. */
  readingsSource: DiabetesReadingsSource;
  limitations: string[];
} & DiabetesSignalHonesty;

export function buildGlucoseSignal(
  context: DiabetesPatientContext,
  readings: DiabetesGlucoseReading[] = [],
  readingsSource: DiabetesReadingsSource = "fixture"
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
      readingsSource,
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
    readingsSource,
    limitations: [
      `${readings.length} reading(s) received (source: ${readingsSource}) — v0 stub does not yet compute TIR/variability/patterns.`,
      "Real derivation deferred to v1 — still pending OQ-DIAB-1 (glucose/CGM modality schema decision)."
    ],
    ...DIABETES_SIGNAL_HONESTY
  };
}
