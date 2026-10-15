/**
 * Diabetes units for any country. Aksh stores glucose in mmol/L and HbA1c in mmol/mol (IFCC) and shows them in the
 * organisation's chosen units (organisation locale: glucoseUnit, hba1cUnit). Defaults follow the country when the
 * organisation has not chosen. Pure.
 */
export type GlucoseUnit = "mmol/L" | "mg/dL";
export type Hba1cUnit = "mmol/mol" | "%";

export const MG_PER_MMOL = 18.0182;

/** IFCC mmol/mol → NGSP/DCCT %. */
export const hba1cPercentFrom = (mmolMol: number) => Math.round((mmolMol / 10.929 + 2.15) * 10) / 10;

export function formatGlucose(mmol: number, unit: GlucoseUnit | string | null | undefined = "mmol/L"): string {
  return unit === "mg/dL" ? `${Math.round(mmol * MG_PER_MMOL)} mg/dL` : `${(Math.round(mmol * 10) / 10).toFixed(1)} mmol/L`;
}

export function formatHba1c(mmolMol: number, unit: Hba1cUnit | string | null | undefined = "mmol/mol"): string {
  return unit === "%" ? `${hba1cPercentFrom(mmolMol)}%` : `${Math.round(mmolMol)} mmol/mol`;
}

/** Countries that report glucose in mmol/L; most others use mg/dL. ISO 3166-1 alpha-2. */
const MMOL_GLUCOSE = new Set(["GB", "IE", "AU", "NZ", "CA", "ZA", "NL", "SE", "DK", "FI", "NO", "IS", "CH", "CZ", "SK", "HU", "SI", "HR", "EE", "LV", "LT", "RU", "UA", "KZ", "CN", "HK", "SG", "MY", "JM", "TT"]);
/** Countries that report HbA1c in mmol/mol (IFCC) as the primary unit; most others use %. */
const MMOL_HBA1C = new Set(["GB", "IE", "NL", "SE", "DK", "FI", "NO", "IS", "NZ", "CZ", "SK", "SI", "EE", "LV", "LT"]);

/** Default units for a country (from a region code or a BCP 47 locale like "en-US"). */
export function defaultUnits(countryOrLocale?: string | null): { glucoseUnit: GlucoseUnit; hba1cUnit: Hba1cUnit } {
  const cc = (countryOrLocale ?? "").split(/[-_]/).pop()?.toUpperCase() ?? "";
  return { glucoseUnit: MMOL_GLUCOSE.has(cc) ? "mmol/L" : "mg/dL", hba1cUnit: MMOL_HBA1C.has(cc) ? "mmol/mol" : "%" };
}
