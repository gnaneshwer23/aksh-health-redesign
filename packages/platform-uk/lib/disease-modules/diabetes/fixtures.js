/**
 * Tiny synthetic demo fixture — deliberately self-contained.
 *
 * This does NOT extend the shared cohort fixtures
 * (data/seed/demo-cohort-patients.json, lib/mock-data/patients.ts). Those
 * files are consumed across dashboards, smoke scripts, and the clinical-proof
 * test suite; adding diabetes fields there is a deliberate v1 step that
 * should land together with the module wiring (see
 * docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md v0 exit criteria) and the open
 * questions on data shape (#1), not as a side effect of this v0 scaffold.
 *
 * Use this fixture only for local exploration / future unit tests of the
 * diabetes module in isolation.
 */
export const DIABETES_DEMO_PATIENT = {
    patientId: "DEMO-DIABETES-P1",
    patientLabel: "Synthetic Diabetes Demo Patient"
};
export const DIABETES_DEMO_GLUCOSE_READINGS = [
    { recordedAt: "2026-07-20T07:00:00.000Z", glucoseMgDl: 142, context: "fasting" },
    { recordedAt: "2026-07-20T13:30:00.000Z", glucoseMgDl: 178, context: "post_prandial" },
    { recordedAt: "2026-07-20T22:00:00.000Z", glucoseMgDl: 118, context: "bedtime" }
];
export const DIABETES_DEMO_HBA1C_READINGS = [
    { recordedAt: "2026-04-01T00:00:00.000Z", valuePercent: 7.8 },
    { recordedAt: "2026-07-01T00:00:00.000Z", valuePercent: 7.5 }
];
export const DIABETES_DEMO_INSULIN_REGIMEN = {
    medications: ["Insulin glargine 20 units OD", "Insulin aspart mealtime, patient-titrated per plan"],
    reportedHypoEventCount: 1
};
export const DIABETES_DEMO_GLP1_SIDE_EFFECTS = ["Mild nausea reported in week 1 (self-report)"];
