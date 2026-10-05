/**
 * High-fidelity synthetic longitudinal clinical bundles.
 * Deterministic, synthetic-only — never real PHI. liveEmis:false.
 */

export type LongitudinalLab = {
  name: string;
  value: string;
  unit?: string;
  recordedAt: string;
  source: "synthetic_lab";
};

export type LongitudinalMedication = {
  name: string;
  status: "active" | "proposed" | "stopped";
  startedAt?: string;
  note?: string;
};

export type LongitudinalEncounter = {
  date: string;
  type: string;
  summary: string;
};

export type LongitudinalBundle = {
  patientId: string;
  syntheticOnly: true;
  realPatientData: false;
  liveEmis: false;
  labs: LongitudinalLab[];
  medications: LongitudinalMedication[];
  encounters: LongitudinalEncounter[];
  allergies: string[];
  missingInformation: string[];
  uncertainties: string[];
  /** Optional review-queue seed hint for extended cohort. */
  draftSeed?: {
    kind: "safety" | "documentation" | "risk";
    title: string;
    detail: string;
  };
};

/** P002 flagship — HbA1c 6.8→8.4 aligns with E2E cohort B / golden scenarios. */
const P002_BUNDLE: LongitudinalBundle = {
  patientId: "P002",
  syntheticOnly: true,
  realPatientData: false,
  liveEmis: false,
  labs: [
    { name: "HbA1c", value: "6.8", unit: "%", recordedAt: "2025-07-10T00:00:00.000Z", source: "synthetic_lab" },
    { name: "HbA1c", value: "7.1", unit: "%", recordedAt: "2025-10-10T00:00:00.000Z", source: "synthetic_lab" },
    { name: "HbA1c", value: "7.6", unit: "%", recordedAt: "2026-01-10T00:00:00.000Z", source: "synthetic_lab" },
    { name: "HbA1c", value: "8.0", unit: "%", recordedAt: "2026-04-10T00:00:00.000Z", source: "synthetic_lab" },
    { name: "HbA1c", value: "8.2", unit: "%", recordedAt: "2026-06-10T00:00:00.000Z", source: "synthetic_lab" },
    { name: "HbA1c", value: "8.4", unit: "%", recordedAt: "2026-07-10T00:00:00.000Z", source: "synthetic_lab" },
    { name: "eGFR", value: "72", unit: "mL/min/1.73m2", recordedAt: "2026-01-10T00:00:00.000Z", source: "synthetic_lab" },
    { name: "eGFR", value: "68", unit: "mL/min/1.73m2", recordedAt: "2026-07-10T00:00:00.000Z", source: "synthetic_lab" },
    { name: "LDL", value: "3.1", unit: "mmol/L", recordedAt: "2026-07-10T00:00:00.000Z", source: "synthetic_lab" },
  ],
  medications: [
    { name: "Metformin 1g BD", status: "active", startedAt: "2023-03-01" },
    { name: "Aspirin 75mg OD", status: "active", startedAt: "2024-01-15", note: "Primary prevention — review indication" },
    { name: "Atorvastatin 20mg ON", status: "active", startedAt: "2023-06-01" },
    {
      name: "Apixaban 10mg BD",
      status: "proposed",
      note: "Proposed for right popliteal DVT — bleeding interaction with aspirin",
    },
  ],
  encounters: [
    {
      date: "2026-07-10",
      type: "GP follow-up",
      summary: "T2D poor control + new right popliteal DVT discussion; anticoagulant proposed",
    },
    {
      date: "2026-04-12",
      type: "Diabetes review",
      summary: "HbA1c rising; lifestyle reinforcement; no insulin started",
    },
    {
      date: "2025-10-15",
      type: "Routine diabetes",
      summary: "Stable metformin; foot check clear",
    },
  ],
  allergies: ["None known"],
  missingInformation: ["ADHERENCE"],
  uncertainties: [
    "HbA1c 6.8→8.4% over 12 months — treat as deteriorating until confirmed.",
    "Aspirin + proposed anticoagulant combination — conflict remains visible, not merged.",
    "eGFR mildly declining 72→68 — renal dosing awareness for future agents.",
  ],
  draftSeed: {
    kind: "safety",
    title: "Drug interaction | Aspirin + Apixaban",
    detail: "Additive bleeding risk — HITL review required before staging",
  },
};

const CORE_BUNDLES: Record<string, LongitudinalBundle> = {
  P002: P002_BUNDLE,
  P001: {
    patientId: "P001",
    syntheticOnly: true,
    realPatientData: false,
    liveEmis: false,
    labs: [
      { name: "BNP", value: "420", unit: "ng/L", recordedAt: "2026-07-09T00:00:00.000Z", source: "synthetic_lab" },
      { name: "eGFR", value: "54", unit: "mL/min/1.73m2", recordedAt: "2026-07-09T00:00:00.000Z", source: "synthetic_lab" },
    ],
    medications: [
      { name: "Furosemide 40mg OD", status: "active" },
      { name: "Bisoprolol 2.5mg OD", status: "active" },
      { name: "Ramipril 2.5mg OD", status: "active" },
    ],
    encounters: [
      {
        date: "2026-07-10",
        type: "Urgent HF review",
        summary: "Weight gain and breathlessness — synthetic decompensation pathway",
      },
    ],
    allergies: ["Penicillin"],
    missingInformation: ["ADHERENCE"],
    uncertainties: ["Fluid status uncertain without recent weight diary."],
  },
  P003: {
    patientId: "P003",
    syntheticOnly: true,
    realPatientData: false,
    liveEmis: false,
    labs: [
      { name: "SpO2 trend", value: "96→94→92", unit: "%", recordedAt: "2026-07-09T00:00:00.000Z", source: "synthetic_lab" },
    ],
    medications: [
      { name: "Furosemide 40mg OD", status: "active", note: "Missed doses last 5 days (synthetic)" },
      { name: "Tiotropium 18mcg OD", status: "active" },
    ],
    encounters: [
      { date: "2026-07-09", type: "Home visit", summary: "COPD/HF frailty — SpO2 declining" },
    ],
    allergies: ["Sulfonamides"],
    missingInformation: ["ADHERENCE", "EGFR"],
    uncertainties: ["Home SpO2 reliability without calibrated device."],
    draftSeed: {
      kind: "risk",
      title: "Admission risk escalation",
      detail: "Very high ORACLE band — HITL pathway review",
    },
  },
  P007: {
    patientId: "P007",
    syntheticOnly: true,
    realPatientData: false,
    liveEmis: false,
    labs: [
      { name: "HbA1c", value: "7.0", unit: "%", recordedAt: "2025-11-01T00:00:00.000Z", source: "synthetic_lab" },
      { name: "HbA1c", value: "6.6", unit: "%", recordedAt: "2026-05-01T00:00:00.000Z", source: "synthetic_lab" },
      { name: "eGFR", value: "88", unit: "mL/min/1.73m2", recordedAt: "2026-05-01T00:00:00.000Z", source: "synthetic_lab" },
    ],
    medications: [{ name: "Metformin 500mg BD", status: "active" }],
    encounters: [
      { date: "2026-05-01", type: "Diabetes review", summary: "Improving HbA1c — continue lifestyle" },
    ],
    allergies: ["None known"],
    missingInformation: ["ADHERENCE"],
    uncertainties: [],
  },
  P017: {
    patientId: "P017",
    syntheticOnly: true,
    realPatientData: false,
    liveEmis: false,
    labs: [
      { name: "HbA1c", value: "7.2", unit: "%", recordedAt: "2026-01-08T00:00:00.000Z", source: "synthetic_lab" },
      { name: "HbA1c", value: "7.3", unit: "%", recordedAt: "2026-07-08T00:00:00.000Z", source: "synthetic_lab" },
      { name: "eGFR", value: "58", unit: "mL/min/1.73m2", recordedAt: "2026-07-08T00:00:00.000Z", source: "synthetic_lab" },
    ],
    medications: [
      { name: "Metformin 1g BD", status: "stopped", note: "EMIS list stopped" },
      { name: "Metformin 1g BD", status: "active", note: "SystmOne export still active — conflict" },
      { name: "Ramipril 5mg OD", status: "active" },
    ],
    encounters: [
      { date: "2026-07-08", type: "Medication reconciliation", summary: "Conflicting EHR medication status" },
    ],
    allergies: ["None known"],
    missingInformation: ["ADHERENCE"],
    uncertainties: ["EMIS vs SystmOne metformin status conflict — not silently merged."],
    draftSeed: {
      kind: "documentation",
      title: "Reconcile conflicting medication lists",
      detail: "Synthetic dual-source conflict fixture",
    },
  },
  P026: {
    patientId: "P026",
    syntheticOnly: true,
    realPatientData: false,
    liveEmis: false,
    labs: [
      { name: "HbA1c", value: "7.6", unit: "%", recordedAt: "2026-06-01T00:00:00.000Z", source: "synthetic_lab" },
    ],
    medications: [
      { name: "Insulin glargine (basal)", status: "active" },
      { name: "Insulin aspart (mealtime)", status: "active" },
    ],
    encounters: [
      { date: "2026-06-15", type: "Diabetes nurse", summary: "Two reported hypo events — synthetic" },
    ],
    allergies: ["None known"],
    missingInformation: ["EGFR"],
    uncertainties: ["Hypoglycaemia risk — nurse review escalation path."],
    draftSeed: {
      kind: "safety",
      title: "Hypoglycaemia safety review",
      detail: "Reported hypo events on basal-bolus regimen",
    },
  },
};

function syntheticBundleForExtended(patientId: string, salt: number): LongitudinalBundle {
  const base = 6.5 + (salt % 20) / 10;
  const latest = Math.min(9.2, base + 0.3 + (salt % 7) / 10);
  const egfr = 90 - (salt % 40);
  const t2d = salt % 3 !== 0;
  return {
    patientId,
    syntheticOnly: true,
    realPatientData: false,
    liveEmis: false,
    labs: t2d
      ? [
          {
            name: "HbA1c",
            value: base.toFixed(1),
            unit: "%",
            recordedAt: "2026-01-15T00:00:00.000Z",
            source: "synthetic_lab",
          },
          {
            name: "HbA1c",
            value: latest.toFixed(1),
            unit: "%",
            recordedAt: "2026-07-15T00:00:00.000Z",
            source: "synthetic_lab",
          },
          {
            name: "eGFR",
            value: String(egfr),
            unit: "mL/min/1.73m2",
            recordedAt: "2026-07-15T00:00:00.000Z",
            source: "synthetic_lab",
          },
        ]
      : [
          {
            name: "eGFR",
            value: String(egfr),
            unit: "mL/min/1.73m2",
            recordedAt: "2026-07-15T00:00:00.000Z",
            source: "synthetic_lab",
          },
        ],
    medications: t2d
      ? [
          { name: "Metformin 1g BD", status: "active" },
          ...(salt % 5 === 0
            ? [{ name: "Apixaban 5mg BD", status: "proposed" as const, note: "Synthetic interaction seed" }]
            : []),
        ]
      : [{ name: "Amlodipine 5mg OD", status: "active" }],
    encounters: [
      {
        date: "2026-07-15",
        type: t2d ? "Diabetes review" : "Routine review",
        summary: `Synthetic longitudinal encounter for ${patientId}`,
      },
    ],
    allergies: ["None known"],
    missingInformation: salt % 2 === 0 ? ["ADHERENCE"] : ["ADHERENCE", "EGFR"],
    uncertainties:
      latest - base > 0.4
        ? [`HbA1c rising ${base.toFixed(1)}→${latest.toFixed(1)}% (synthetic).`]
        : [],
    draftSeed:
      salt % 4 === 0
        ? {
            kind: salt % 8 === 0 ? "safety" : "documentation",
            title: salt % 8 === 0 ? "Medication safety draft" : "SOAP documentation draft",
            detail: `Synthetic review-queue seed for ${patientId}`,
          }
        : undefined,
  };
}

export function getLongitudinalBundle(patientId: string): LongitudinalBundle | null {
  if (CORE_BUNDLES[patientId]) return CORE_BUNDLES[patientId]!;
  const match = /^P(\d+)$/.exec(patientId);
  if (!match) return null;
  const n = Number(match[1]);
  if (n >= 27 && n <= 100) {
    return syntheticBundleForExtended(patientId, n);
  }
  return null;
}

export function listLongitudinalPatientIds(): string[] {
  return Object.keys(CORE_BUNDLES);
}

export function getHba1cSeriesPercent(patientId: string): Array<{ recordedAt: string; valuePercent: number }> {
  const bundle = getLongitudinalBundle(patientId);
  if (!bundle) return [];
  return bundle.labs
    .filter((l) => l.name === "HbA1c")
    .map((l) => ({ recordedAt: l.recordedAt, valuePercent: Number(l.value) }))
    .filter((r) => Number.isFinite(r.valuePercent));
}
