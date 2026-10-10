import type { OracleRisk } from "./types";

/**
 * Single source for HORIZON risk bands. Labels are always derived from the score so the
 * queue badge and the narrative can't disagree (e.g. P002 at 82 is Very High, not High).
 */
export const RISK_BANDS: Record<OracleRisk, [number, number]> = {
  Low: [0, 28],
  Medium: [29, 55],
  High: [56, 78],
  VeryHigh: [79, 100],
};

export function riskBandForScore(score: number): OracleRisk {
  if (score >= RISK_BANDS.VeryHigh[0]) return "VeryHigh";
  if (score >= RISK_BANDS.High[0]) return "High";
  if (score >= RISK_BANDS.Medium[0]) return "Medium";
  return "Low";
}
