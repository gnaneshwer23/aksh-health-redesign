/**
 * Curated open subset of clinical codes for the synthetic demo cohort.
 *
 * NOT a full SNOMED CT UK / LOINC / ATC redistribution.
 * Codes are illustrative for stakeholder demos — not clinical validation,
 * not a terminology-server substitute, not licensed UK RF2 content.
 *
 * Provenance / licensing notes: docs/DEMO_COHORT_SEED.md § Terminology
 * and data/seed/demo-terminology-curated.json (artifact mirror).
 */

export const DEMO_TERMINOLOGY_SYSTEMS = {
  snomed: "http://snomed.info/sct",
  loinc: "http://loinc.org",
  atc: "http://www.whocc.no/atc",
} as const;

export type DemoTerminologySystem =
  (typeof DEMO_TERMINOLOGY_SYSTEMS)[keyof typeof DEMO_TERMINOLOGY_SYSTEMS];

export type DemoCodedConcept = {
  system: DemoTerminologySystem | string;
  code: string;
  display: string;
  /** Human label as shown on the chart / HITL item. */
  text: string;
};

export type DemoCodedMedication = DemoCodedConcept & {
  /** ATC class only in demo — dm+d AMP/VMP ids are citation-only, never vendored. */
  dmdCitationNote?: string;
};

export type DemoTerminologyProvenance = {
  purpose: "synthetic_demo_cohort_only";
  clinicalValidation: false;
  fullDistributionsVendored: false;
  snomedEditionNote: string;
  loincNote: string;
  atcNote: string;
  dmdNote: string;
  sources: string[];
};

export const DEMO_TERMINOLOGY_PROVENANCE: DemoTerminologyProvenance = {
  purpose: "synthetic_demo_cohort_only",
  clinicalValidation: false,
  fullDistributionsVendored: false,
  snomedEditionNote:
    "Illustrative SNOMED CT concept ids commonly used in UK GP narratives. Demo does not redistribute UK Edition RF2. Production UK use requires NHS England / SNOMED International registration and a licensed terminology server.",
  loincNote:
    "Small curated LOINC codes for common UK primary-care labs (HbA1c, eGFR, FBC, U&E constituents). Not a LOINC dump; Regenstrief attribution applies for production LOINC use.",
  atcNote:
    "WHO ATC class codes for demo medication classes. Not a prescribing authority; not EPS/dm+d product codes.",
  dmdNote:
    "NHS dm+d (AMP/VMP) is citation-only — not ingested. Map ATC → dm+d in a licensed environment before clinical use.",
  sources: [
    "SNOMED CT International concept ids (publicly documented clinical concepts; UK edition registration required for production)",
    "LOINC (Regenstrief Institute) — curated subset only",
    "WHO Collaborating Centre for Drug Statistics Methodology — ATC/DDD",
    "Aksh Health synthetic demo cohort (demo-cohort-v2-stakeholder)",
  ],
};

/** Condition display text → SNOMED (prefer concepts familiar in UK GP coding). */
export const DEMO_SNOMED_CONDITIONS: Record<string, { code: string; display: string }> = {
  "Type 2 diabetes mellitus": { code: "44054006", display: "Type 2 diabetes mellitus" },
  "Type 2 diabetes mellitus: well controlled": {
    code: "44054006",
    display: "Type 2 diabetes mellitus",
  },
  "Type 1 diabetes mellitus": { code: "46635009", display: "Diabetes mellitus type 1" },
  "Essential hypertension": { code: "59621000", display: "Essential hypertension" },
  Hypertension: { code: "38341003", display: "Hypertensive disorder" },
  "Heart failure with reduced ejection fraction": {
    code: "703272007",
    display: "Heart failure with reduced ejection fraction",
  },
  "Heart failure": { code: "84114007", display: "Heart failure" },
  "CKD Stage 3": { code: "433144002", display: "Chronic kidney disease stage 3" },
  "CKD Stage 4": { code: "431857002", display: "Chronic kidney disease stage 4" },
  COPD: { code: "13645005", display: "Chronic obstructive lung disease" },
  "Frailty syndrome": { code: "443694000", display: "Frailty" },
  Osteoarthritis: { code: "396275006", display: "Osteoarthritis" },
  Gout: { code: "90560007", display: "Gout" },
  "Deep vein thrombosis risk": { code: "128053003", display: "Deep venous thrombosis" },
  "Deep vein thrombosis": { code: "128053003", display: "Deep venous thrombosis" },
  "Deep vein thrombosis: right popliteal": {
    code: "128053003",
    display: "Deep venous thrombosis",
  },
  "Deep vein thrombosis: left calf (prior)": {
    code: "128053003",
    display: "Deep venous thrombosis",
  },
  Asthma: { code: "195967001", display: "Asthma" },
  "Asthma: well controlled": { code: "195967001", display: "Asthma" },
  "Asthma — paediatric": { code: "195967001", display: "Asthma" },
  "Major depressive disorder": { code: "370143000", display: "Major depressive disorder" },
  Depression: { code: "35489007", display: "Depressive disorder" },
  "Recurrent depressive disorder": { code: "66344007", display: "Recurrent major depression" },
  "Anxiety disorder": { code: "197480006", display: "Anxiety disorder" },
  Insomnia: { code: "193462001", display: "Insomnia" },
  "Acute suicidal ideation": { code: "6471006", display: "Suicidal ideation" },
  "Breast cancer: adjuvant therapy": { code: "254837009", display: "Malignant neoplasm of breast" },
  "Prostate cancer: active treatment": {
    code: "399068003",
    display: "Malignant tumor of prostate",
  },
  "Colorectal cancer: adjuvant chemotherapy": {
    code: "363406005",
    display: "Malignant neoplasm of colon",
  },
  NAFLD: { code: "197321007", display: "Steatosis of liver" },
  "Alcohol-related liver disease": {
    code: "420054005",
    display: "Alcoholic cirrhosis",
  },
  Thrombocytopenia: { code: "302215000", display: "Thrombocytopenic disorder" },
  "Pregnancy — second trimester": { code: "77386006", display: "Pregnancy" },
  "Antenatal care: 28 weeks gestation": { code: "77386006", display: "Pregnancy" },
  "Gestational diabetes screening": {
    code: "11687002",
    display: "Gestational diabetes mellitus",
  },
  "Chronic pain": { code: "82423001", display: "Chronic pain" },
};

/** Lab investigation label → LOINC. */
export const DEMO_LOINC_LABS: Record<string, { code: string; display: string }> = {
  HbA1c: { code: "4548-4", display: "Hemoglobin A1c/Hemoglobin.total in Blood" },
  eGFR: {
    code: "33914-3",
    display: "Glomerular filtration rate/1.73 sq M.predicted [Volume Rate/Area] in Serum or Plasma by Creatinine-based formula (MDRD)",
  },
  LDL: { code: "2089-1", display: "Cholesterol in LDL [Mass/volume] in Serum or Plasma" },
  "Full blood count": { code: "58410-2", display: "Complete blood count (hemogram) panel - Blood by Automated count" },
  FBC: { code: "58410-2", display: "Complete blood count (hemogram) panel - Blood by Automated count" },
  "U&E": { code: "24321-2", display: "Basic metabolic 1998 panel - Serum or Plasma" },
  Urea: { code: "3091-6", display: "Urea nitrogen [Mass/volume] in Serum or Plasma" },
  Creatinine: { code: "2160-0", display: "Creatinine [Mass/volume] in Serum or Plasma" },
  Sodium: { code: "2951-2", display: "Sodium [Moles/volume] in Serum or Plasma" },
  Potassium: { code: "2823-3", display: "Potassium [Moles/volume] in Serum or Plasma" },
  Glucose: { code: "2345-7", display: "Glucose [Mass/volume] in Serum or Plasma" },
};

/**
 * Medication free-text (dose strings included) → ATC class.
 * Matching uses longest-prefix / contains heuristics on the generic stem.
 */
export const DEMO_ATC_MEDICATIONS: {
  match: RegExp;
  code: string;
  display: string;
  dmdCitationNote: string;
}[] = [
  {
    match: /metformin/i,
    code: "A10BA02",
    display: "metformin",
    dmdCitationNote: "Map to NHS dm+d VMP/AMP in licensed env — not vendored here",
  },
  {
    match: /ramipril/i,
    code: "C09AA05",
    display: "ramipril",
    dmdCitationNote: "Map to NHS dm+d VMP/AMP in licensed env — not vendored here",
  },
  {
    match: /lisinopril/i,
    code: "C09AA03",
    display: "lisinopril",
    dmdCitationNote: "Map to NHS dm+d VMP/AMP in licensed env — not vendored here",
  },
  {
    match: /atorvastatin/i,
    code: "C10AA05",
    display: "atorvastatin",
    dmdCitationNote: "Map to NHS dm+d VMP/AMP in licensed env — not vendored here",
  },
  {
    match: /furosemide/i,
    code: "C03CA01",
    display: "furosemide",
    dmdCitationNote: "Map to NHS dm+d VMP/AMP in licensed env — not vendored here",
  },
  {
    match: /bisoprolol/i,
    code: "C07AB07",
    display: "bisoprolol",
    dmdCitationNote: "Map to NHS dm+d VMP/AMP in licensed env — not vendored here",
  },
  {
    match: /salbutamol/i,
    code: "R03AC02",
    display: "salbutamol",
    dmdCitationNote: "Map to NHS dm+d VMP/AMP in licensed env — not vendored here",
  },
  {
    match: /tiotropium/i,
    code: "R03BB04",
    display: "tiotropium bromide",
    dmdCitationNote: "Map to NHS dm+d VMP/AMP in licensed env — not vendored here",
  },
  {
    match: /prednisolone/i,
    code: "H02AB06",
    display: "prednisolone",
    dmdCitationNote: "Map to NHS dm+d VMP/AMP in licensed env — not vendored here",
  },
  {
    match: /allopurinol/i,
    code: "M04AA01",
    display: "allopurinol",
    dmdCitationNote: "Map to NHS dm+d VMP/AMP in licensed env — not vendored here",
  },
  {
    match: /paracetamol/i,
    code: "N02BE01",
    display: "paracetamol",
    dmdCitationNote: "Map to NHS dm+d VMP/AMP in licensed env — not vendored here",
  },
  {
    match: /omeprazole/i,
    code: "A02BC01",
    display: "omeprazole",
    dmdCitationNote: "Map to NHS dm+d VMP/AMP in licensed env — not vendored here",
  },
  {
    match: /amlodipine/i,
    code: "C08CA01",
    display: "amlodipine",
    dmdCitationNote: "Map to NHS dm+d VMP/AMP in licensed env — not vendored here",
  },
  {
    match: /colecalciferol|vitamin d/i,
    code: "A11CC05",
    display: "colecalciferol",
    dmdCitationNote: "Map to NHS dm+d VMP/AMP in licensed env — not vendored here",
  },
  {
    match: /apixaban/i,
    code: "B01AF02",
    display: "apixaban",
    dmdCitationNote: "Map to NHS dm+d VMP/AMP in licensed env — not vendored here",
  },
  {
    match: /rivaroxaban/i,
    code: "B01AF01",
    display: "rivaroxaban",
    dmdCitationNote: "Map to NHS dm+d VMP/AMP in licensed env — not vendored here",
  },
  {
    match: /sertraline/i,
    code: "N06AB06",
    display: "sertraline",
    dmdCitationNote: "Map to NHS dm+d VMP/AMP in licensed env — not vendored here",
  },
  {
    match: /zopiclone/i,
    code: "N05CF01",
    display: "zopiclone",
    dmdCitationNote: "Map to NHS dm+d VMP/AMP in licensed env — not vendored here",
  },
  {
    match: /mirtazapine/i,
    code: "N06AX11",
    display: "mirtazapine",
    dmdCitationNote: "Map to NHS dm+d VMP/AMP in licensed env — not vendored here",
  },
  {
    match: /letrozole/i,
    code: "L02BG04",
    display: "letrozole",
    dmdCitationNote: "Map to NHS dm+d VMP/AMP in licensed env — not vendored here",
  },
  {
    match: /ondansetron/i,
    code: "A04AA01",
    display: "ondansetron",
    dmdCitationNote: "Map to NHS dm+d VMP/AMP in licensed env — not vendored here",
  },
  {
    match: /folic acid/i,
    code: "B03BB01",
    display: "folic acid",
    dmdCitationNote: "Map to NHS dm+d VMP/AMP in licensed env — not vendored here",
  },
  {
    match: /\baspirin\b/i,
    code: "B01AC06",
    display: "acetylsalicylic acid",
    dmdCitationNote: "Map to NHS dm+d VMP/AMP in licensed env — not vendored here",
  },
  {
    match: /clenil|beclometasone|beclomethasone/i,
    code: "R03BA01",
    display: "beclometasone",
    dmdCitationNote: "Map to NHS dm+d VMP/AMP in licensed env — not vendored here",
  },
  {
    match: /spironolactone/i,
    code: "C03DA01",
    display: "spironolactone",
    dmdCitationNote: "Map to NHS dm+d VMP/AMP in licensed env — not vendored here",
  },
  {
    match: /lactulose/i,
    code: "A06AD11",
    display: "lactulose",
    dmdCitationNote: "Map to NHS dm+d VMP/AMP in licensed env — not vendored here",
  },
  {
    match: /indapamide/i,
    code: "C03BA11",
    display: "indapamide",
    dmdCitationNote: "Map to NHS dm+d VMP/AMP in licensed env — not vendored here",
  },
  {
    match: /insulin glargine/i,
    code: "A10AE04",
    display: "insulin glargine",
    dmdCitationNote: "Map to NHS dm+d VMP/AMP in licensed env — not vendored here",
  },
  {
    match: /insulin aspart/i,
    code: "A10AB05",
    display: "insulin aspart",
    dmdCitationNote: "Map to NHS dm+d VMP/AMP in licensed env — not vendored here",
  },
  {
    match: /bicalutamide/i,
    code: "L02BB03",
    display: "bicalutamide",
    dmdCitationNote: "Map to NHS dm+d VMP/AMP in licensed env — not vendored here",
  },
  {
    match: /ferrous/i,
    code: "B03AA07",
    display: "ferrous sulfate",
    dmdCitationNote: "Map to NHS dm+d VMP/AMP in licensed env — not vendored here",
  },
  {
    match: /capecitabine/i,
    code: "L01BC06",
    display: "capecitabine",
    dmdCitationNote: "Map to NHS dm+d VMP/AMP in licensed env — not vendored here",
  },
  {
    match: /loperamide/i,
    code: "A07DA03",
    display: "loperamide",
    dmdCitationNote: "Map to NHS dm+d VMP/AMP in licensed env — not vendored here",
  },
];

/** Pharmacy HITL counselling / adherence labels → ATC where a drug class is implied. */
export const DEMO_ATC_PHARMACY_HITL: Record<string, { code: string; display: string }> = {
  "Metformin adherence check": { code: "A10BA02", display: "metformin" },
  "Statin counselling": { code: "C10AA", display: "HMG CoA reductase inhibitors" },
  "Apixaban counselling (synthetic)": { code: "B01AF02", display: "apixaban" },
};

export function resolveSnomedCondition(text: string): DemoCodedConcept | null {
  const exact = DEMO_SNOMED_CONDITIONS[text];
  if (exact) {
    return {
      system: DEMO_TERMINOLOGY_SYSTEMS.snomed,
      code: exact.code,
      display: exact.display,
      text,
    };
  }
  return null;
}

export function resolveLoincLab(text: string): DemoCodedConcept | null {
  const exact = DEMO_LOINC_LABS[text];
  if (exact) {
    return {
      system: DEMO_TERMINOLOGY_SYSTEMS.loinc,
      code: exact.code,
      display: exact.display,
      text,
    };
  }
  return null;
}

export function resolveAtcMedication(text: string): DemoCodedMedication | null {
  for (const row of DEMO_ATC_MEDICATIONS) {
    if (row.match.test(text)) {
      return {
        system: DEMO_TERMINOLOGY_SYSTEMS.atc,
        code: row.code,
        display: row.display,
        text,
        dmdCitationNote: row.dmdCitationNote,
      };
    }
  }
  return null;
}

export function resolvePharmacyHitlAtc(text: string): DemoCodedConcept | null {
  const exact = DEMO_ATC_PHARMACY_HITL[text];
  if (exact) {
    return {
      system: DEMO_TERMINOLOGY_SYSTEMS.atc,
      code: exact.code,
      display: exact.display,
      text,
    };
  }
  return resolveAtcMedication(text);
}

export function codeConditions(texts: string[]): DemoCodedConcept[] {
  return texts
    .map((t) => resolveSnomedCondition(t))
    .filter((c): c is DemoCodedConcept => Boolean(c));
}

export function codeMedications(texts: string[]): DemoCodedMedication[] {
  return texts
    .map((t) => resolveAtcMedication(t))
    .filter((c): c is DemoCodedMedication => Boolean(c));
}

export function codeLabItems(texts: string[]): DemoCodedConcept[] {
  return texts
    .map((t) => resolveLoincLab(t))
    .filter((c): c is DemoCodedConcept => Boolean(c));
}

export function codePharmacyHitlItems(texts: string[]): DemoCodedConcept[] {
  return texts
    .map((t) => resolvePharmacyHitlAtc(t))
    .filter((c): c is DemoCodedConcept => Boolean(c));
}

/** Attach SNOMED/ATC coded fields onto a patient chart (idempotent). */
export function attachPatientTerminology<
  T extends {
    activeConditions: string[];
    activeMedications: string[];
    codedConditions?: DemoCodedConcept[];
    codedMedications?: DemoCodedMedication[];
  },
>(patient: T): T {
  return {
    ...patient,
    codedConditions: codeConditions(patient.activeConditions),
    codedMedications: codeMedications(patient.activeMedications),
  };
}

export function buildDemoTerminologyArtifact() {
  return {
    ...DEMO_TERMINOLOGY_PROVENANCE,
    syntheticDemo: true as const,
    removable: true as const,
    systems: DEMO_TERMINOLOGY_SYSTEMS,
    conditions: Object.entries(DEMO_SNOMED_CONDITIONS).map(([text, row]) => ({
      text,
      system: DEMO_TERMINOLOGY_SYSTEMS.snomed,
      ...row,
    })),
    labs: Object.entries(DEMO_LOINC_LABS).map(([text, row]) => ({
      text,
      system: DEMO_TERMINOLOGY_SYSTEMS.loinc,
      ...row,
    })),
    medications: DEMO_ATC_MEDICATIONS.map(({ match, code, display, dmdCitationNote }) => ({
      match: String(match),
      system: DEMO_TERMINOLOGY_SYSTEMS.atc,
      code,
      display,
      dmdCitationNote,
    })),
    pharmacyHitl: Object.entries(DEMO_ATC_PHARMACY_HITL).map(([text, row]) => ({
      text,
      system: DEMO_TERMINOLOGY_SYSTEMS.atc,
      ...row,
    })),
  };
}

/** Hermetic invariants for CI — sample bindings must resolve. */
export function assertDemoTerminologyInvariants() {
  const t2d = resolveSnomedCondition("Type 2 diabetes mellitus");
  if (!t2d || t2d.code !== "44054006" || t2d.system !== DEMO_TERMINOLOGY_SYSTEMS.snomed) {
    throw new Error("Expected SNOMED 44054006 for Type 2 diabetes mellitus");
  }
  const hba1c = resolveLoincLab("HbA1c");
  if (!hba1c || hba1c.code !== "4548-4" || hba1c.system !== DEMO_TERMINOLOGY_SYSTEMS.loinc) {
    throw new Error("Expected LOINC 4548-4 for HbA1c");
  }
  const metformin = resolveAtcMedication("Metformin 1g BD");
  if (!metformin || metformin.code !== "A10BA02" || metformin.system !== DEMO_TERMINOLOGY_SYSTEMS.atc) {
    throw new Error("Expected ATC A10BA02 for Metformin");
  }
  const fbc = resolveLoincLab("Full blood count");
  if (!fbc || fbc.code !== "58410-2") {
    throw new Error("Expected LOINC 58410-2 for Full blood count");
  }
  if (DEMO_TERMINOLOGY_PROVENANCE.clinicalValidation !== false) {
    throw new Error("Demo terminology must not claim clinicalValidation");
  }
  if (DEMO_TERMINOLOGY_PROVENANCE.fullDistributionsVendored !== false) {
    throw new Error("Must not claim full terminology distributions are vendored");
  }
  return {
    snomedSample: t2d,
    loincSample: hba1c,
    atcSample: metformin,
    conditionCount: Object.keys(DEMO_SNOMED_CONDITIONS).length,
    labCount: Object.keys(DEMO_LOINC_LABS).length,
    medicationPatternCount: DEMO_ATC_MEDICATIONS.length,
  };
}
