/**
 * HbA1c display for clinicians: IFCC mmol/mol first, DCCT % in brackets. Engines and storage use mmol/mol
 * (lib/units.ts); only presentation shows %.
 */
import { hba1cMmolFromPercent, hba1cPercentFrom } from "./units";

/** Kept for callers converting a value entered in %. */
export function hba1cPercentToMmolMol(percent: number): number {
  return hba1cMmolFromPercent(percent);
}

export function formatHbA1c(mmolMol: number): string {
  return `${Math.round(mmolMol)} mmol/mol (${hba1cPercentFrom(mmolMol)}%)`;
}
