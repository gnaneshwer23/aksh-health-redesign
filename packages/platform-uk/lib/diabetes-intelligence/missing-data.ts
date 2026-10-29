import type { ClinicalHistorySnapshot, GlucoseObservation, MissingDataIndicator } from "./types";

/** Minimum readings before we treat glucose series as usable for draft context. */
export const MIN_GLUCOSE_FOR_PLAN = 3;

export function assessHistoryMissing(history: ClinicalHistorySnapshot): MissingDataIndicator[] {
  const out: MissingDataIndicator[] = [];
  for (const field of history.missingFields) {
    out.push({
      code: `history_${field}`,
      message: `Clinical history field missing: ${field}`,
      field,
    });
  }
  if (history.conditions.length === 0) {
    out.push({
      code: "history_conditions",
      message: "No active conditions recorded",
      field: "conditions",
    });
  }
  if (history.medications.length === 0) {
    out.push({
      code: "history_medications",
      message: "No medications recorded",
      field: "medications",
    });
  }
  return out;
}

export function assessGlucoseMissing(observations: GlucoseObservation[]): {
  missingData: MissingDataIndicator[];
  dataCompleteness: number;
} {
  const missingData: MissingDataIndicator[] = [];
  if (observations.length === 0) {
    missingData.push({
      code: "glucose_none",
      message: "No glucose observations available",
      field: "glucose",
    });
    return { missingData, dataCompleteness: 0 };
  }
  if (observations.length < MIN_GLUCOSE_FOR_PLAN) {
    missingData.push({
      code: "glucose_sparse",
      message: `Only ${observations.length} glucose reading(s); need ≥${MIN_GLUCOSE_FOR_PLAN} for a fuller draft`,
      field: "glucose",
    });
  }
  const withoutContext = observations.filter((o) => !o.context).length;
  if (withoutContext > 0) {
    missingData.push({
      code: "glucose_context",
      message: `${withoutContext} reading(s) lack fasting/post-prandial context`,
      field: "context",
    });
  }
  const completeness = Math.min(1, observations.length / Math.max(MIN_GLUCOSE_FOR_PLAN, 1));
  return { missingData, dataCompleteness: Number(completeness.toFixed(2)) };
}
