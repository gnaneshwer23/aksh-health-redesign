/**
 * Rule registry (Phase 1 audit P1-5): every clinical threshold the worklists and agents use, with its source, version
 * and sign-off state, and where it lives in the code. tests/rule-registry.test.ts reads each `codeRef` and fails when
 * the code no longer contains the registered threshold, so a rule cannot change silently.
 *
 * Sign-off: "pending_clinical_lead" rules flag for clinician review only, until the organisation's clinical lead signs
 * them off as part of go-live. "operational" rules involve no clinical judgement (data quality, ordering, workflow).
 * Each organisation records which guideline it follows (organisation settings: guideline name and version).
 */
export type RuleSignOff = "pending_clinical_lead" | "operational";

export type ClinicalRule = {
  id: string;
  version: string;
  area: "kidney" | "lipids" | "liver" | "glycaemia" | "cgm" | "risk" | "data_quality" | "safety_route" | "access";
  statement: string;
  /** Published source the threshold follows; "Aksh heuristic" when it is our own and not from a guideline. */
  source: string;
  sourceDetail: string;
  effectiveFrom: string;
  signOff: RuleSignOff;
  /** File and an exact text fragment that must appear in it. */
  codeRef: { file: string; contains: string };
  usedBy: string[];
};

const KDIGO = "KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of CKD";
const CONSENSUS = "International Consensus on Time in Range (Battelino et al., Diabetes Care 2019)";

export const RULES: ClinicalRule[] = [
  // Kidney (complications, lab-rules-2026-10-20)
  { id: "kidney.egfr_below_60", version: "lab-rules-2026-10-20", area: "kidney", statement: "eGFR below 60 mL/min/1.73 m² → kidney watch", source: KDIGO, sourceDetail: "GFR category G3a and below", effectiveFrom: "2026-10-20", signOff: "pending_clinical_lead", codeRef: { file: "lib/disease-modules/diabetes/complications.ts", contains: "test: (v) => v < 60" }, usedBy: ["Aksh Diabetes complications", "HORIZON factors"] },
  { id: "kidney.egfr_below_30", version: "lab-rules-2026-10-20", area: "kidney", statement: "eGFR below 30 → referral indicated (clinician confirms)", source: KDIGO, sourceDetail: "GFR category G4 and below", effectiveFrom: "2026-10-20", signOff: "pending_clinical_lead", codeRef: { file: "lib/disease-modules/diabetes/complications.ts", contains: "test: (v) => v < 30" }, usedBy: ["Aksh Diabetes complications", "PATHWAY"] },
  { id: "kidney.acr_above_3", version: "lab-rules-2026-10-20", area: "kidney", statement: "Urine ACR above 3 mg/mmol → kidney watch", source: KDIGO, sourceDetail: "Albuminuria category A2 and above", effectiveFrom: "2026-10-20", signOff: "pending_clinical_lead", codeRef: { file: "lib/disease-modules/diabetes/complications.ts", contains: "test: (v) => v > 3" }, usedBy: ["Aksh Diabetes complications"] },
  { id: "kidney.acr_30_or_more", version: "lab-rules-2026-10-20", area: "kidney", statement: "Urine ACR 30 mg/mmol or more → referral indicated (clinician confirms)", source: KDIGO, sourceDetail: "Albuminuria category A3", effectiveFrom: "2026-10-20", signOff: "pending_clinical_lead", codeRef: { file: "lib/disease-modules/diabetes/complications.ts", contains: "test: (v) => v >= 30" }, usedBy: ["Aksh Diabetes complications", "PATHWAY"] },
  { id: "labs.max_age_15_months", version: "lab-rules-2026-10-20", area: "data_quality", statement: "Results older than 15 months are not used and are shown as missing", source: "Aksh heuristic", sourceDetail: "Annual diabetes review plus a 3-month margin", effectiveFrom: "2026-10-20", signOff: "pending_clinical_lead", codeRef: { file: "lib/disease-modules/diabetes/complications.ts", contains: "LAB_MAX_AGE_MONTHS = 15" }, usedBy: ["Aksh Diabetes complications"] },
  // Lipids and liver
  { id: "lipids.ldl_2_6", version: "lab-rules-2026-10-20", area: "lipids", statement: "LDL 2.6 mmol/L or more → cardiovascular watch (never a referral on its own)", source: "Aksh heuristic", sourceDetail: "2.6 mmol/L (100 mg/dL) is a widely used upper goal; current diabetes and cardiology guidance sets lower goals (for example 1.8 or 1.4 mmol/L) by cardiovascular risk, so each organisation should set its own", effectiveFrom: "2026-10-20", signOff: "pending_clinical_lead", codeRef: { file: "lib/disease-modules/diabetes/complications.ts", contains: "test: (v) => v >= 2.6" }, usedBy: ["Aksh Diabetes complications"] },
  { id: "liver.alt_above_40", version: "lab-rules-2026-10-20", area: "liver", statement: "ALT above 40 U/L → liver watch (never a referral on its own)", source: "Aksh heuristic", sourceDetail: "Common laboratory upper reference limit; sex-specific limits not yet applied", effectiveFrom: "2026-10-20", signOff: "pending_clinical_lead", codeRef: { file: "lib/disease-modules/diabetes/complications.ts", contains: "test: (v) => v > 40" }, usedBy: ["Aksh Diabetes complications"] },
  // Glycaemia
  { id: "hba1c.target_53", version: "network-v1", area: "glycaemia", statement: "HbA1c at or below 53 mmol/mol (7%) counts as at target in summaries", source: "ADA Standards of Care in Diabetes 2025, section 6", sourceDetail: "A1C goal below 7% for many non-pregnant adults; individualised", effectiveFrom: "2026-10-01", signOff: "pending_clinical_lead", codeRef: { file: "lib/network/read.ts", contains: "HBA1C_TARGET_MMOL = 53" }, usedBy: ["Care network summary"] },
  { id: "hba1c.stable_band_2", version: "hba1c-engine-mmol-2026-10-20", area: "glycaemia", statement: "A change under 2 mmol/mol between the two latest results is 'stable'", source: "Aksh heuristic", sourceDetail: "About 0.2 percentage points", effectiveFrom: "2026-10-20", signOff: "pending_clinical_lead", codeRef: { file: "lib/disease-modules/diabetes/hba1c.ts", contains: "STABLE_BAND_MMOL = 2" }, usedBy: ["Aksh Diabetes HbA1c trend", "HORIZON factors"] },
  // CGM
  { id: "cgm.tir_70", version: "cgm-consensus-2019", area: "cgm", statement: "Time in range under 70% is flagged", source: CONSENSUS, sourceDetail: "General adult target TIR > 70%", effectiveFrom: "2026-10-01", signOff: "pending_clinical_lead", codeRef: { file: "lib/cgm/metrics.ts", contains: "if (m.inRange < 70)" }, usedBy: ["CGM monitoring worklist"] },
  { id: "cgm.tbr_54_1pct", version: "cgm-consensus-2019", area: "cgm", statement: "Time below 3.0 mmol/L (54 mg/dL) of 1% or more is flagged first", source: CONSENSUS, sourceDetail: "Level 2 hypoglycaemia target below 1%", effectiveFrom: "2026-10-01", signOff: "pending_clinical_lead", codeRef: { file: "lib/cgm/metrics.ts", contains: "if (m.veryLow >= 1)" }, usedBy: ["CGM monitoring worklist"] },
  { id: "cgm.tbr_4pct", version: "cgm-consensus-2019", area: "cgm", statement: "Time below range of 4% or more is flagged", source: CONSENSUS, sourceDetail: "TBR target below 4%", effectiveFrom: "2026-10-01", signOff: "pending_clinical_lead", codeRef: { file: "lib/cgm/metrics.ts", contains: "if (m.veryLow + m.low >= 4)" }, usedBy: ["CGM monitoring worklist"] },
  { id: "cgm.cv_36", version: "cgm-consensus-2019", area: "cgm", statement: "Glucose variability (CV) above 36% is flagged", source: CONSENSUS, sourceDetail: "CV target 36% or less", effectiveFrom: "2026-10-01", signOff: "pending_clinical_lead", codeRef: { file: "lib/cgm/metrics.ts", contains: "if (m.cvPct > 36)" }, usedBy: ["CGM monitoring worklist"] },
  { id: "cgm.sufficiency", version: "cgm-consensus-2019", area: "data_quality", statement: "Metrics are reliable only with 14 days and 70% sensor wear; otherwise shown as insufficient", source: CONSENSUS, sourceDetail: "Minimum data for reliable CGM metrics", effectiveFrom: "2026-10-01", signOff: "operational", codeRef: { file: "lib/cgm/metrics.ts", contains: "needs 14 days and 70%" }, usedBy: ["CGM monitoring worklist", "Aksh Diabetes glucose"] },
  // Risk score drivers (care network)
  { id: "risk.egfr_45_60", version: "network-v1", area: "risk", statement: "eGFR below 45 adds 16 points, below 60 adds 8", source: "Aksh heuristic", sourceDetail: "Ordering aid for the worklist, not a clinical score", effectiveFrom: "2026-10-01", signOff: "pending_clinical_lead", codeRef: { file: "lib/network/derive.ts", contains: "if (d.egfr < 45) add(16" }, usedBy: ["Care network risk ordering"] },
  { id: "risk.hba1c_bands", version: "network-v1", area: "risk", statement: "HbA1c 58 / 64 / 75 mmol/mol or more add 10 / 20 / 30 points", source: "Aksh heuristic", sourceDetail: "Ordering aid for the worklist, not a clinical score", effectiveFrom: "2026-10-01", signOff: "pending_clinical_lead", codeRef: { file: "lib/network/derive.ts", contains: "if (a1c >= 75) add(30" }, usedBy: ["Care network risk ordering"] },
  // Data quality
  { id: "labs.plausible_ranges", version: "lab-catalog-2026-10-20", area: "data_quality", statement: "Laboratory values outside the plausible range for their kind are refused, not stored", source: "Aksh heuristic", sourceDetail: "Catches unit and entry errors (lib/labs/catalog.ts ranges)", effectiveFrom: "2026-10-20", signOff: "operational", codeRef: { file: "lib/labs/catalog.ts", contains: "is outside the plausible range" }, usedBy: ["Connector", "CSV import", "Staff entry"] },
  // Workflow
  { id: "access.slot_fill_rules", version: "slot-fill-rules-v1", area: "access", statement: "Waiting-list eligibility and ranking for freed slots, in the order the clinic sets", source: "Organisation settings", sourceDetail: "Clinic-defined reason order and offer limits", effectiveFrom: "2026-10-01", signOff: "operational", codeRef: { file: "lib/access/eligibility.ts", contains: 'RULE_VERSION = "slot-fill-rules-v1"' }, usedBy: ["Cancelled-slot fill"] },
];

export function rule(id: string): ClinicalRule {
  const r = RULES.find((x) => x.id === id);
  if (!r) throw new Error(`Unknown rule ${id}`);
  return r;
}
