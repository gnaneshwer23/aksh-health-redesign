import type { ModalitySample, StoredModalitySample } from "./modalities";

/**
 * Biomarker-lite — surface a few numeric fields from consented modality samples.
 * Not a biomarker derivation engine / IntelliProve / clinical lab pipeline.
 */

export type BiomarkerLite = {
  heartRateBpm?: number;
  steps?: number;
  spo2Percent?: number;
  sleepHours?: number;
  activityMinutesPerWeek?: number;
  systolicBpMmHg?: number;
  diastolicBpMmHg?: number;
};

export function extractBiomarkerLite(
  sample: ModalitySample | StoredModalitySample
): BiomarkerLite | undefined {
  if (sample.modality === "wearable") {
    const out: BiomarkerLite = {};
    if (sample.restingHeartRateBpm != null) out.heartRateBpm = sample.restingHeartRateBpm;
    if (sample.steps != null) out.steps = sample.steps;
    if (sample.spo2Percent != null) out.spo2Percent = sample.spo2Percent;
    if (sample.systolicBpMmHg != null) out.systolicBpMmHg = sample.systolicBpMmHg;
    if (sample.diastolicBpMmHg != null) out.diastolicBpMmHg = sample.diastolicBpMmHg;
    return Object.keys(out).length > 0 ? out : undefined;
  }

  if (sample.modality === "lifestyle") {
    const out: BiomarkerLite = {};
    if (sample.sleepHoursTypical != null) out.sleepHours = sample.sleepHoursTypical;
    if (sample.activityMinutesPerWeek != null) {
      out.activityMinutesPerWeek = sample.activityMinutesPerWeek;
    }
    return Object.keys(out).length > 0 ? out : undefined;
  }

  return undefined;
}

/** Compact labels for timeline chips — never invents values. */
export function formatBiomarkerLite(biomarkers: BiomarkerLite): string[] {
  const chips: string[] = [];
  if (biomarkers.heartRateBpm != null) chips.push(`HR ${biomarkers.heartRateBpm} bpm`);
  if (biomarkers.steps != null) chips.push(`Steps ${biomarkers.steps.toLocaleString("en-GB")}`);
  if (biomarkers.spo2Percent != null) chips.push(`SpO₂ ${biomarkers.spo2Percent}%`);
  if (biomarkers.sleepHours != null) chips.push(`Sleep ${biomarkers.sleepHours} h`);
  if (biomarkers.activityMinutesPerWeek != null) {
    chips.push(`Activity ${biomarkers.activityMinutesPerWeek} min/wk`);
  }
  if (biomarkers.systolicBpMmHg != null && biomarkers.diastolicBpMmHg != null) {
    chips.push(`BP ${biomarkers.systolicBpMmHg}/${biomarkers.diastolicBpMmHg}`);
  } else if (biomarkers.systolicBpMmHg != null) {
    chips.push(`BP sys ${biomarkers.systolicBpMmHg}`);
  }
  return chips;
}
