/**
 * Laboratory results Aksh accepts: LOINC codes, the unit each is stored in (UCUM), unit conversions and plausible
 * ranges. One place, used by every ingestion path (connector, manual entry, CSV import) so a value means the same thing
 * whichever way it arrived. Pure: no I/O, safe for tests and the edge.
 *
 * Stored units follow lib/units.ts: glucose mmol/L, HbA1c mmol/mol (IFCC). Display converts per organisation.
 * A value outside the plausible range is refused, not clamped: it is almost always a unit or entry error.
 */

export const LAB_KINDS = ["hba1c", "glucose", "egfr", "acr", "ldl", "total_cholesterol", "hdl", "triglycerides", "creatinine", "alt"] as const;
export type LabKind = (typeof LAB_KINDS)[number];

type Conversion = Record<string, (v: number) => number>;

export type LabDefinition = {
  kind: LabKind;
  label: string;
  /** Unit stored (UCUM). */
  unit: string;
  /** The same unit written for people. */
  displayUnit: string;
  /** LOINC codes that map to this kind. */
  loinc: string[];
  /** Accepted units (normalised, see normaliseUnit) and how to convert each to the stored unit. */
  units: Conversion;
  /** Plausible range in the stored unit; outside it the value is refused. */
  range: [number, number];
  decimals: number;
};

const same = (v: number) => v;
const CHOL_MG_PER_MMOL = 38.67;
const TG_MG_PER_MMOL = 88.57;
const GLUCOSE_MG_PER_MMOL = 18.0182;
const CREATININE_UMOL_PER_MG_DL = 88.42;
const ACR_MG_G_PER_MG_MMOL = 8.84;

export const LAB_CATALOG: Record<LabKind, LabDefinition> = {
  hba1c: {
    kind: "hba1c",
    label: "HbA1c",
    unit: "mmol/mol",
    displayUnit: "mmol/mol",
    loinc: ["4548-4", "17856-6", "41995-2", "59261-8"],
    // IFCC-NGSP master equation: mmol/mol = (% − 2.15) × 10.929.
    units: { "mmol/mol": same, "%": (v) => (v - 2.15) * 10.929 },
    range: [15, 200],
    decimals: 0,
  },
  glucose: {
    kind: "glucose",
    label: "Glucose (laboratory)",
    unit: "mmol/L",
    displayUnit: "mmol/L",
    loinc: ["2345-7", "2339-0", "1558-6", "14749-6", "14771-0", "41604-0"],
    units: { "mmol/l": same, "mg/dl": (v) => v / GLUCOSE_MG_PER_MMOL },
    range: [1, 40],
    decimals: 1,
  },
  egfr: {
    kind: "egfr",
    label: "eGFR",
    unit: "mL/min/{1.73_m2}",
    displayUnit: "mL/min/1.73 m²",
    loinc: ["33914-3", "48642-3", "48643-1", "62238-1", "69405-9", "88293-6", "88294-4", "98979-8"],
    units: { "ml/min/{1.73_m2}": same, "ml/min/1.73m2": same, "ml/min/1.73_m2": same },
    range: [1, 200],
    decimals: 0,
  },
  acr: {
    kind: "acr",
    label: "Urine albumin:creatinine ratio",
    unit: "mg/mmol",
    displayUnit: "mg/mmol",
    loinc: ["14959-1", "9318-7", "13705-9", "32294-1"],
    units: { "mg/mmol": same, "mg/g": (v) => v / ACR_MG_G_PER_MG_MMOL },
    range: [0, 3000],
    decimals: 1,
  },
  ldl: {
    kind: "ldl",
    label: "LDL cholesterol",
    unit: "mmol/L",
    displayUnit: "mmol/L",
    loinc: ["22748-8", "13457-7", "18262-6", "2089-1", "39469-2"],
    units: { "mmol/l": same, "mg/dl": (v) => v / CHOL_MG_PER_MMOL },
    range: [0.1, 15],
    decimals: 1,
  },
  total_cholesterol: {
    kind: "total_cholesterol",
    label: "Total cholesterol",
    unit: "mmol/L",
    displayUnit: "mmol/L",
    loinc: ["14647-2", "2093-3"],
    units: { "mmol/l": same, "mg/dl": (v) => v / CHOL_MG_PER_MMOL },
    range: [0.5, 20],
    decimals: 1,
  },
  hdl: {
    kind: "hdl",
    label: "HDL cholesterol",
    unit: "mmol/L",
    displayUnit: "mmol/L",
    loinc: ["14646-4", "2085-9"],
    units: { "mmol/l": same, "mg/dl": (v) => v / CHOL_MG_PER_MMOL },
    range: [0.1, 5],
    decimals: 2,
  },
  triglycerides: {
    kind: "triglycerides",
    label: "Triglycerides",
    unit: "mmol/L",
    displayUnit: "mmol/L",
    loinc: ["14927-8", "2571-8"],
    units: { "mmol/l": same, "mg/dl": (v) => v / TG_MG_PER_MMOL },
    range: [0.1, 50],
    decimals: 1,
  },
  creatinine: {
    kind: "creatinine",
    label: "Creatinine (serum)",
    unit: "umol/L",
    displayUnit: "µmol/L",
    loinc: ["14682-9", "2160-0", "38483-4"],
    units: { "umol/l": same, "mg/dl": (v) => v * CREATININE_UMOL_PER_MG_DL },
    range: [10, 2000],
    decimals: 0,
  },
  alt: {
    kind: "alt",
    label: "ALT",
    unit: "U/L",
    displayUnit: "U/L",
    loinc: ["1742-6", "1743-4", "1744-2", "76625-3"],
    units: { "u/l": same, "iu/l": same, "[iu]/l": same },
    range: [1, 5000],
    decimals: 0,
  },
};

const BY_LOINC = new Map<string, LabKind>(Object.values(LAB_CATALOG).flatMap((d) => d.loinc.map((c) => [c, d.kind] as const)));

export function isLabKind(kind: string): kind is LabKind {
  return (LAB_KINDS as readonly string[]).includes(kind);
}

/** The lab kind for a LOINC code, or null. */
export function labKindForLoinc(code: string | null | undefined): LabKind | null {
  return code ? BY_LOINC.get(code.trim()) ?? null : null;
}

/** Lower-case, no spaces, µ/μ as u, "per" spellings left as written. */
export function normaliseUnit(unit: string): string {
  return unit.trim().toLowerCase().replace(/\s+/g, "").replace(/[µμ]/g, "u");
}

export type LabValue =
  | { ok: true; kind: LabKind; value: number; unit: string; originalValue: number; originalUnit: string }
  | { ok: false; code: "UNKNOWN_UNIT" | "OUT_OF_RANGE" | "INVALID_VALUE"; message: string };

/** Converts a reported value to the stored unit and checks it is plausible. */
export function normaliseLab(kind: LabKind, value: number, unit: string): LabValue {
  const d = LAB_CATALOG[kind];
  if (!Number.isFinite(value)) return { ok: false, code: "INVALID_VALUE", message: `${d.label}: value must be a number` };
  const convert = d.units[normaliseUnit(unit)];
  if (!convert) return { ok: false, code: "UNKNOWN_UNIT", message: `${d.label}: unit "${unit}" is not accepted (use ${Object.keys(d.units).join(", ")})` };
  const f = 10 ** d.decimals;
  const stored = Math.round(convert(value) * f) / f;
  const [min, max] = d.range;
  if (!(stored >= min && stored <= max)) return { ok: false, code: "OUT_OF_RANGE", message: `${d.label}: ${stored} ${d.unit} is outside the plausible range ${min}–${max}` };
  return { ok: true, kind, value: stored, unit: d.unit, originalValue: value, originalUnit: unit };
}
