/**
 * HbA1c display for UK primary care: IFCC mmol/mol first, DCCT % in brackets.
 * Engines keep storing % (latestValuePercent); only presentation converts.
 * mmol/mol = (DCCT% − 2.15) × 10.929
 */
export function hba1cPercentToMmolMol(percent: number): number {
  return Math.round((percent - 2.15) * 10.929);
}

export function formatHbA1c(percent: number): string {
  return `${hba1cPercentToMmolMol(percent)} mmol/mol (${percent}%)`;
}
