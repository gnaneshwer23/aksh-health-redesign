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
 * decision has been recorded, and this file does not decide it. Fixture-
 * sourced readings stay an honest "insufficient data" stub forever, until
 * that decision lands.
 *
 * C6 (docs/PHASED_BUILD_PLAN_C.md, P1-2): `readings` may now come from a
 * real Patient State ingest (lib/disease-modules/diabetes/ingest.ts) instead
 * of the static fixture bundle — the `readingsSource` parameter lets the
 * caller (index.ts's composite) stamp which one, so ingested and
 * fixture-derived readings are never silently blended without a visible
 * provenance tag.
 *
 * D2 (docs/PHASED_BUILD_PLAN_D.md, `PED-DIAB-1` — Provisional Engineering
 * Decision, NOT a resolution of OQ-DIAB-1): for readings whose provenance is
 * `"patient_state_ingest"` AND whose count is at least
 * `MIN_READINGS_FOR_DERIVATION`, this module now derives a real TIR
 * (time-in-range) percentage, a variability estimate (%CV), and named
 * glycaemic pattern flags — using a fixed, DEFAULT, non-personalised target
 * band (`DEFAULT_TARGET_BAND`, the standard ADA/NICE Type 2 non-pregnant
 * adult glycaemic range), never a clinician-set individual target. This is
 * deliberately narrower than OQ-DIAB-1 itself: it does not touch
 * lib/precision-health/modalities.ts, it does not choose between extending
 * `wearableSampleSchema` vs. a new `glucose` modality, and it changes
 * nothing for fixture-sourced or below-threshold readings — those remain
 * byte-identical to the pre-D2 `insufficient_data` stub. Every derived
 * output carries `targetBand` and an explicit "provisional/default band,
 * pending clinical lead" limitation string — never presented as a
 * clinician-approved target. See PHASED_BUILD_PLAN_D.md D2 for the full
 * decision record and reversibility note.
 */

export type GlucosePatternFlag =
  | "dawn_phenomenon_suspected"
  | "post_prandial_spike_suspected"
  | "nocturnal_hypo_suspected"
  | "insufficient_data";

/**
 * "care_network_cgm": trusted CGM readings from the care network (clinic uploads, device feeds, clinician-reviewed
 * patient uploads; `aksh.cgm_trusted_readings`). Real readings like `patient_state_ingest`, with their own provenance
 * tag so they are never blended silently. Simulation and rehearsal only until Track B opens.
 */
export type DiabetesReadingsSource = "fixture" | "patient_state_ingest" | "care_network_cgm";

/** Real readings (not fixtures) are eligible for derivation. */
export const isRealReadingsSource = (s: DiabetesReadingsSource) => s === "patient_state_ingest" || s === "care_network_cgm";

export type GlucoseTargetBand = {
  lowMgDl: number;
  highMgDl: number;
};

/**
 * D2/`PED-DIAB-1`: standard ADA/NICE Type 2 non-pregnant adult glycaemic
 * target range (3.9-10.0 mmol/L ≈ 70-180 mg/dL) — a well-established,
 * citable clinical convention used here only as a DEFAULT reference band,
 * never a personalised clinical target. Not configurable per-patient in
 * this phase; a future clinical-lead decision (OQ-DIAB-1 and beyond) may
 * replace or parameterise this.
 */
export const DEFAULT_TARGET_BAND: GlucoseTargetBand = { lowMgDl: 70, highMgDl: 180 };

/** D2: minimum ingested reading count before TIR/variability/pattern derivation is attempted. Below this, stays `insufficient_data` even for real ingested data. */
export const MIN_READINGS_FOR_DERIVATION = 5;

/** D2: fixed margin (mg/dL) a post-prandial reading must exceed the band's upper bound by to suspect a spike, rather than flagging on any single borderline reading. */
const POST_PRANDIAL_SPIKE_MARGIN_MGDL = 20;
/** D2: fixed rise (mg/dL) a fasting reading must exceed the preceding day's bedtime reading by to suspect a dawn-phenomenon pattern. */
const DAWN_PHENOMENON_RISE_MGDL = 30;

const PROVISIONAL_BAND_LIMITATION =
  `Target band ${DEFAULT_TARGET_BAND.lowMgDl}-${DEFAULT_TARGET_BAND.highMgDl} mg/dL is a DEFAULT, non-personalised ADA/NICE convention, ` +
  "not a clinician-set individual target — provisional pending the clinical lead's OQ-DIAB-1 decision (docs/PHASED_BUILD_PLAN_D.md D2, PED-DIAB-1).";

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
  /** D2: present only when a real derivation ran (patient_state_ingest, ≥ MIN_READINGS_FOR_DERIVATION). Absent for every stub output. */
  targetBand?: GlucoseTargetBand;
  limitations: string[];
} & DiabetesSignalHonesty;

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function stubSignal(
  context: DiabetesPatientContext,
  readings: DiabetesGlucoseReading[],
  readingsSource: DiabetesReadingsSource
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
        "No glucose readings supplied — stub does not fabricate CGM/BGM data.",
        "TIR / variability / pattern derivation deferred (docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md)."
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
    limitations:
      isRealReadingsSource(readingsSource)
        ? [
            `${readings.length} reading(s) received from real data (source: ${readingsSource}) — fewer than the minimum of ${MIN_READINGS_FOR_DERIVATION} required for TIR/variability/pattern derivation (docs/PHASED_BUILD_PLAN_D.md D2).`,
            "Real derivation deferred until enough readings are on file."
          ]
        : [
            `${readings.length} reading(s) received (source: ${readingsSource}) — stub does not compute TIR/variability/patterns for fixture/demo data.`,
            "Real derivation is only available for real (patient_state_ingest) readings — see docs/PHASED_BUILD_PLAN_D.md D2, PED-DIAB-1."
          ],
    ...DIABETES_SIGNAL_HONESTY
  };
}

/** D2: coefficient of variation (%CV = stdev / mean * 100) — a standard, widely-used glycaemic-variability statistic (ADA/ATTD consensus reporting), not a novel formula. */
function coefficientOfVariation(values: number[]): number {
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  if (mean === 0) return 0;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return (Math.sqrt(variance) / mean) * 100;
}

/** Returns an empty array when derivation ran but no named pattern was detected — distinct from the stub's `["insufficient_data"]`, since "sufficient data, no pattern found" is not the same claim as "not enough data to say anything." */
function derivePatternFlags(readings: DiabetesGlucoseReading[], band: GlucoseTargetBand): GlucosePatternFlag[] {
  const flags: GlucosePatternFlag[] = [];

  const hasPostPrandialSpike = readings.some(
    (r) => r.context === "post_prandial" && r.glucoseMgDl > band.highMgDl + POST_PRANDIAL_SPIKE_MARGIN_MGDL
  );
  if (hasPostPrandialSpike) flags.push("post_prandial_spike_suspected");

  const hasNocturnalHypo = readings.some((r) => r.context === "bedtime" && r.glucoseMgDl < band.lowMgDl);
  if (hasNocturnalHypo) flags.push("nocturnal_hypo_suspected");

  const sorted = [...readings].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
  const hasDawnPhenomenon = sorted.some((reading, i) => {
    if (reading.context !== "fasting") return false;
    const priorBedtime = [...sorted.slice(0, i)].reverse().find((r) => r.context === "bedtime");
    return Boolean(priorBedtime) && reading.glucoseMgDl - priorBedtime!.glucoseMgDl >= DAWN_PHENOMENON_RISE_MGDL;
  });
  if (hasDawnPhenomenon) flags.push("dawn_phenomenon_suspected");

  return flags;
}

export function buildGlucoseSignal(
  context: DiabetesPatientContext,
  readings: DiabetesGlucoseReading[] = [],
  readingsSource: DiabetesReadingsSource = "fixture"
): GlucoseSignal {
  const eligibleForDerivation =
    isRealReadingsSource(readingsSource) && readings.length >= MIN_READINGS_FOR_DERIVATION;

  if (!eligibleForDerivation) {
    return stubSignal(context, readings, readingsSource);
  }

  const patientLabel = context.patientLabel?.trim() || context.patientId;
  const band = DEFAULT_TARGET_BAND;
  const values = readings.map((r) => r.glucoseMgDl);
  const inRangeCount = values.filter((v) => v >= band.lowMgDl && v <= band.highMgDl).length;
  const tirPercent = round1((inRangeCount / values.length) * 100);
  const variabilityScore = round1(coefficientOfVariation(values));
  const patternFlags = derivePatternFlags(readings, band);

  return {
    moduleId: "GLUCOSE",
    feedsInto: "HORIZON",
    patientId: context.patientId,
    patientLabel,
    tirPercent,
    variabilityScore,
    patternFlags,
    dataCompleteness: "sufficient",
    readingsSource,
    targetBand: band,
    limitations: [
      readingsSource === "care_network_cgm"
        ? `Derived from ${readings.length} trusted care-network CGM reading(s) (last 14 days) — rules-based TIR/%CV/pattern heuristics; the clinic's CGM monitoring view is the reference calculation.`
        : `Derived from ${readings.length} real Patient State-ingested reading(s) — rules-based TIR/%CV/pattern heuristics, not a CGM-grade calculation (no CGM data source exists yet, see OQ-DIAB-1).`,
      PROVISIONAL_BAND_LIMITATION,
      "Pattern flags are named heuristics (fixed thresholds), not a diagnosis — clinician review required before any patient-facing use."
    ],
    ...DIABETES_SIGNAL_HONESTY
  };
}
