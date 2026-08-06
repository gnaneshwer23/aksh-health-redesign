import type {
  DiabetesGlucoseReading,
  DiabetesHbA1cReading,
  DiabetesPatientContext
} from "./types";
import type { InsulinRegimenSummary } from "./insulin";
import type { DiabetesComplicationDomain } from "./complications";

/**
 * Synthetic demo fixtures — deliberately self-contained.
 *
 * This does NOT extend the shared cohort fixtures' TYPE
 * (data/seed/demo-cohort-patients.json, lib/mock-data/patients.ts / Patient).
 * Those files are consumed across dashboards, smoke scripts, and the
 * clinical-proof test suite; changing the shared `Patient` type is a bigger
 * blast radius than this module needs. Instead, `DIABETES_COHORT_FIXTURES`
 * below keys diabetes-shaped data (HbA1c history, regimen detail,
 * self-reported glucose/side-effect notes) by the SAME patient ids already
 * used in lib/mock-data/patients.ts — so a diabetes-flagged patient
 * (`clinicalProfiles` includes `"t2d"`) picks up real fixture data when the
 * module is wired in (see index.ts, lib/clinical-spine/orchestrate.ts),
 * without touching the shared Patient type or any other module that reads
 * it. This is the v1 (B3) step the v0 scaffold's own note said should land
 * "together with the module wiring."
 *
 * Cohort coverage (docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md v1 exit
 * criteria: "demo cohort shows a coherent diabetes narrative"):
 * - P002 (Mr James Patel) — worsening HbA1c, one neuropathy evidence ref (watch).
 * - P007 (Mrs Priya Sharma) — well-controlled T2D, improving HbA1c, no complications.
 * - P017 (Mrs Nora Whitfield) — T2D + conflicting-records fixture, stable HbA1c, CKD watch.
 * - P020 (Mrs Aisha Khan) — steroid-dependent COPD+T2D, worsening HbA1c, two complication
 *   evidence refs (referral_indicated) — exercises the Prevention "worsening" + referral path.
 * - P026 (Master Ethan Brooks) — T1D on insulin, reported hypo events (GUARDIAN flag path),
 *   single HbA1c reading (insufficient_data trend).
 * - DEMO-DIABETES-P1 — original v0 self-contained synthetic patient, kept for isolated
 *   unit testing of the module independent of the shared cohort.
 *
 * Use DIABETES_DEMO_* directly for isolated unit tests of individual builders;
 * use getDiabetesFixtureBundle(patientId) for the composite (index.ts) / CONDUCTOR wiring path.
 */

export const DIABETES_DEMO_PATIENT: DiabetesPatientContext = {
  patientId: "DEMO-DIABETES-P1",
  patientLabel: "Synthetic Diabetes Demo Patient"
};

export const DIABETES_DEMO_GLUCOSE_READINGS: DiabetesGlucoseReading[] = [
  { recordedAt: "2026-07-20T07:00:00.000Z", glucoseMgDl: 142, context: "fasting" },
  { recordedAt: "2026-07-20T13:30:00.000Z", glucoseMgDl: 178, context: "post_prandial" },
  { recordedAt: "2026-07-20T22:00:00.000Z", glucoseMgDl: 118, context: "bedtime" }
];

export const DIABETES_DEMO_HBA1C_READINGS: DiabetesHbA1cReading[] = [
  { recordedAt: "2026-04-01T00:00:00.000Z", valuePercent: 7.8 },
  { recordedAt: "2026-07-01T00:00:00.000Z", valuePercent: 7.5 }
];

export const DIABETES_DEMO_INSULIN_REGIMEN: InsulinRegimenSummary = {
  medications: ["Insulin glargine 20 units OD", "Insulin aspart mealtime, patient-titrated per plan"],
  reportedHypoEventCount: 1
};

export const DIABETES_DEMO_GLP1_SIDE_EFFECTS: string[] = ["Mild nausea reported in week 1 (self-report)"];

export type DiabetesFixtureBundle = {
  glucoseReadings: DiabetesGlucoseReading[];
  hba1cReadings: DiabetesHbA1cReading[];
  insulinRegimen?: InsulinRegimenSummary;
  glp1SideEffects: string[];
  complicationEvidence: Partial<Record<DiabetesComplicationDomain, string[]>>;
};

export const EMPTY_DIABETES_FIXTURE_BUNDLE: DiabetesFixtureBundle = {
  glucoseReadings: [],
  hba1cReadings: [],
  insulinRegimen: undefined,
  glp1SideEffects: [],
  complicationEvidence: {}
};

/** Synthetic-only, keyed by the shared cohort's patient id (lib/mock-data/patients.ts). */
const DIABETES_COHORT_FIXTURES: Record<string, DiabetesFixtureBundle> = {
  [DIABETES_DEMO_PATIENT.patientId]: {
    glucoseReadings: DIABETES_DEMO_GLUCOSE_READINGS,
    hba1cReadings: DIABETES_DEMO_HBA1C_READINGS,
    insulinRegimen: DIABETES_DEMO_INSULIN_REGIMEN,
    glp1SideEffects: DIABETES_DEMO_GLP1_SIDE_EFFECTS,
    complicationEvidence: {
      ckd: ["eGFR 52 mL/min/1.73m2 (mild-moderate reduction) — synthetic lab"]
    }
  },
  P002: {
    glucoseReadings: [
      { recordedAt: "2026-06-01T07:00:00.000Z", glucoseMgDl: 156, context: "fasting" },
      { recordedAt: "2026-06-01T13:00:00.000Z", glucoseMgDl: 201, context: "post_prandial" }
    ],
    hba1cReadings: [
      { recordedAt: "2026-01-10T00:00:00.000Z", valuePercent: 7.4 },
      { recordedAt: "2026-07-10T00:00:00.000Z", valuePercent: 8.1 }
    ],
    insulinRegimen: {
      medications: ["No insulin — Metformin 1g BD only"],
      reportedHypoEventCount: 0
    },
    glp1SideEffects: [],
    complicationEvidence: {
      neuropathy: ["Reported intermittent foot tingling — synthetic self-report, unconfirmed"]
    }
  },
  P007: {
    glucoseReadings: [
      { recordedAt: "2026-04-15T07:00:00.000Z", glucoseMgDl: 118, context: "fasting" },
      { recordedAt: "2026-04-15T13:00:00.000Z", glucoseMgDl: 142, context: "post_prandial" }
    ],
    hba1cReadings: [
      { recordedAt: "2025-11-01T00:00:00.000Z", valuePercent: 7.0 },
      { recordedAt: "2026-05-01T00:00:00.000Z", valuePercent: 6.6 }
    ],
    insulinRegimen: {
      medications: ["No insulin — Metformin 500mg BD only"],
      reportedHypoEventCount: 0
    },
    glp1SideEffects: [],
    complicationEvidence: {}
  },
  P017: {
    glucoseReadings: [],
    hba1cReadings: [
      { recordedAt: "2026-01-08T00:00:00.000Z", valuePercent: 7.2 },
      { recordedAt: "2026-07-08T00:00:00.000Z", valuePercent: 7.3 }
    ],
    insulinRegimen: {
      medications: ["No insulin recorded — Metformin/Ramipril per EMIS; SystmOne export conflicting"],
      reportedHypoEventCount: 0
    },
    glp1SideEffects: [],
    complicationEvidence: {
      ckd: ["eGFR 58 mL/min/1.73m2 — synthetic lab, single reading"]
    }
  },
  P020: {
    glucoseReadings: [
      { recordedAt: "2026-05-01T07:00:00.000Z", glucoseMgDl: 168, context: "fasting" },
      { recordedAt: "2026-07-05T07:00:00.000Z", glucoseMgDl: 205, context: "fasting" }
    ],
    hba1cReadings: [
      { recordedAt: "2026-01-05T00:00:00.000Z", valuePercent: 8.0 },
      { recordedAt: "2026-07-05T00:00:00.000Z", valuePercent: 8.9 }
    ],
    insulinRegimen: {
      medications: ["No insulin — Metformin 850mg BD; steroid-dependent COPD may affect glycaemic control"],
      reportedHypoEventCount: 0
    },
    glp1SideEffects: ["Mild nausea reported (self-report, week 2)"],
    complicationEvidence: {
      retinopathy: ["Retinal screening: background changes noted — synthetic imaging-metadata note"],
      ckd: ["eGFR 61 mL/min/1.73m2, declining trend over 2 readings — synthetic lab"]
    }
  },
  P026: {
    glucoseReadings: [],
    hba1cReadings: [{ recordedAt: "2026-06-01T00:00:00.000Z", valuePercent: 7.6 }],
    insulinRegimen: {
      medications: ["Insulin glargine (basal)", "Insulin aspart (mealtime)"],
      reportedHypoEventCount: 2
    },
    glp1SideEffects: [],
    complicationEvidence: {}
  }
};

/** Never throws — unknown patient ids return the empty bundle (module stays honest, never fabricates data). */
export function getDiabetesFixtureBundle(patientId: string): DiabetesFixtureBundle {
  return DIABETES_COHORT_FIXTURES[patientId] ?? EMPTY_DIABETES_FIXTURE_BUNDLE;
}

/** Patient ids this fixture set carries diabetes-shaped data for (used by tests / demo narrative checks). */
export function getDiabetesFixtureCohortIds(): string[] {
  return Object.keys(DIABETES_COHORT_FIXTURES);
}
