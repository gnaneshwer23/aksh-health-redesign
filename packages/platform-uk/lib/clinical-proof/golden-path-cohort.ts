/**
 * Parameterized multi-patient golden-path cohort for clinical-proof E2E.
 * Covers diverse profiles across the synthetic 26-patient set — not copy-paste specs.
 *
 * Partner-blocked steps (live EMIS write-back, CIS2, Mirth) are declared per patient
 * and must never be fake-passed.
 */

export type GoldenPathPartnerBlock =
  | "emis-live-writeback"
  | "cis2"
  | "mirth"
  | "neo4j-live";

export type GoldenPathPatient = {
  id: string;
  /** Display name for UI assertions */
  name: string;
  /** Clinically diverse profile tags (documentation / filtering) */
  profiles: string[];
  /** Drug for GUARDIAN proposed-drug check */
  proposedDrug: string;
  /** Short synthetic transcript for SYNTHESIS in orchestration flows */
  transcript: string;
  /** Expect GUARDIAN / queue urgency (red interaction or URGENT flag) */
  expectUrgentGuardian: boolean;
  /** Honest partner gaps — asserted as blocked, never as PASS */
  partnerBlocked: GoldenPathPartnerBlock[];
};

/**
 * 8 of 26 cohort patients — diverse clinical profiles for Sprint B golden paths.
 * Patel (P002) keeps its dedicated UI spec; still listed for orchestration reuse.
 */
export const GOLDEN_PATH_COHORT: readonly GoldenPathPatient[] = [
  {
    id: "P001",
    name: "Mrs Sarah Johnson",
    profiles: ["heart_failure", "dvt_risk", "drug_allergy", "high_risk_deterioration"],
    proposedDrug: "Apixaban",
    transcript:
      "Patient reports increasing ankle swelling and breathlessness. Known HFrEF and DVT. Penicillin allergy. On furosemide and apixaban.",
    expectUrgentGuardian: true,
    partnerBlocked: ["emis-live-writeback", "cis2", "mirth"]
  },
  {
    id: "P002",
    name: "Mr James Patel",
    profiles: ["t2d", "hypertension", "dvt_risk"],
    proposedDrug: "Apixaban",
    transcript:
      "Five-day left calf swelling. T2D on metformin and aspirin. Suspect DVT — consider anticoagulation after imaging.",
    expectUrgentGuardian: true,
    partnerBlocked: ["emis-live-writeback", "cis2", "mirth"]
  },
  {
    id: "P003",
    name: "Mrs Margaret Williams",
    profiles: ["copd", "heart_failure", "frailty", "drug_allergy"],
    proposedDrug: "Prednisolone",
    transcript:
      "COPD exacerbation with frailty. Increased sputum and breathlessness. Allergy history relevant to antibiotic choice.",
    expectUrgentGuardian: true,
    partnerBlocked: ["emis-live-writeback", "cis2", "mirth"]
  },
  {
    id: "P004",
    name: "Mr Daniel Chen",
    profiles: ["hypertension", "renal_impairment"],
    proposedDrug: "Ibuprofen",
    transcript:
      "CKD stage 3 with hypertension. BP above target. Review ACE inhibitor dosing and avoid nephrotoxic NSAIDs.",
    expectUrgentGuardian: false,
    partnerBlocked: ["emis-live-writeback", "cis2", "mirth"]
  },
  {
    id: "P008",
    name: "Mr Thomas Green",
    profiles: ["polypharmacy", "frailty", "hypertension", "drug_allergy"],
    proposedDrug: "Aspirin",
    transcript:
      "Frailty with nine active medicines including warfarin and ibuprofen. Falls risk. STOPP/START medication review needed.",
    expectUrgentGuardian: true,
    partnerBlocked: ["emis-live-writeback", "cis2", "mirth"]
  },
  {
    id: "P009",
    name: "Baby Lily Davies",
    profiles: ["paediatric"],
    proposedDrug: "Amoxicillin",
    transcript:
      "Infant developmental check. On vitamin D drops. Immunisation schedule review. Weight and length within expected range.",
    expectUrgentGuardian: false,
    partnerBlocked: ["emis-live-writeback", "cis2", "mirth"]
  },
  {
    id: "P015",
    name: "Mr George Mitchell",
    profiles: ["hypertension", "missing_clinical_info"],
    proposedDrug: "Ramipril",
    transcript:
      "Hypertension follow-up. Last encounter omits BP and eGFR — missing clinical information must be completed before Accept.",
    expectUrgentGuardian: false,
    partnerBlocked: ["emis-live-writeback", "cis2", "mirth"]
  },
  {
    id: "P018",
    name: "Mr Samuel Okonkwo",
    profiles: ["heart_failure", "renal_impairment", "high_risk_deterioration"],
    proposedDrug: "Spironolactone",
    transcript:
      "HFrEF with CKD stage 4. Rapid weight gain and rising NEWS2. Same-day decompensation pathway and renal dosing review.",
    expectUrgentGuardian: true,
    partnerBlocked: ["emis-live-writeback", "cis2", "mirth"]
  }
] as const;

/** Patients used in the multi-patient Playwright suite (excludes dedicated Patel UI path). */
export const MULTI_PATIENT_E2E_COHORT = GOLDEN_PATH_COHORT.filter((p) => p.id !== "P002");

export const GOLDEN_PATH_PARTNER_BLOCKS_ALWAYS: GoldenPathPartnerBlock[] = [
  "emis-live-writeback",
  "cis2",
  "mirth"
];

export function getGoldenPathPatient(id: string): GoldenPathPatient | undefined {
  return GOLDEN_PATH_COHORT.find((p) => p.id === id);
}

export function assertPartnerBlocksHonest(patient: GoldenPathPatient) {
  for (const block of GOLDEN_PATH_PARTNER_BLOCKS_ALWAYS) {
    if (!patient.partnerBlocked.includes(block)) {
      throw new Error(
        `${patient.id} must declare partner block "${block}" — never fake-pass live partners`
      );
    }
  }
}
