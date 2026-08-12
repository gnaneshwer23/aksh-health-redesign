/**
 * Aksh Health E2E platform validation — synthetic ecosystem types.
 * All entities are synthetic · source AKSH_E2E_TEST · liveEmis:false always.
 */

import type { UserRole } from "../onboarding/roles";

export const E2E_SOURCE = "AKSH_E2E_TEST" as const;
export const E2E_EMAIL_DOMAIN = "e2e.akshhealth.com" as const;
export const E2E_DEFAULT_PASSWORD = "AkshE2E!2026" as const;
export const E2E_DEFAULT_SEED = 20260812;

export type E2ECohortId = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";

export type E2ECohortDefinition = {
  id: E2ECohortId;
  label: string;
  targetCount: number;
  expectedDecisionBias:
    | "OBSERVE"
    | "INFORM"
    | "REQUEST_APPROVAL"
    | "ESCALATE"
    | "ACQUIRE_DATA";
  description: string;
};

export const E2E_COHORTS: E2ECohortDefinition[] = [
  {
    id: "A",
    label: "Stable diabetes",
    targetCount: 20,
    expectedDecisionBias: "OBSERVE",
    description: "HbA1c stable, good adherence, low/moderate risk",
  },
  {
    id: "B",
    label: "Gradual deterioration",
    targetCount: 20,
    expectedDecisionBias: "REQUEST_APPROVAL",
    description: "Rising HbA1c, weight gain, declining activity",
  },
  {
    id: "C",
    label: "High-risk diabetes",
    targetCount: 15,
    expectedDecisionBias: "ESCALATE",
    description: "Poor glycaemic control, CKD, hypertension, obesity",
  },
  {
    id: "D",
    label: "Possible hypoglycaemia",
    targetCount: 10,
    expectedDecisionBias: "ESCALATE",
    description: "CGM hypo patterns — safety analysis required",
  },
  {
    id: "E",
    label: "Medication/adherence problems",
    targetCount: 10,
    expectedDecisionBias: "REQUEST_APPROVAL",
    description: "Missed doses, side effects, access issues",
  },
  {
    id: "F",
    label: "Missing information",
    targetCount: 10,
    expectedDecisionBias: "ACQUIRE_DATA",
    description: "Gaps in renal, HbA1c, BP, allergy data",
  },
  {
    id: "G",
    label: "Complex multimorbidity",
    targetCount: 10,
    expectedDecisionBias: "REQUEST_APPROVAL",
    description: "Diabetes + HTN + CKD + CVD + polypharmacy",
  },
  {
    id: "H",
    label: "Recently improving",
    targetCount: 5,
    expectedDecisionBias: "INFORM",
    description: "Positive trajectory — detect improvement",
  },
];

export type E2ESyntheticMetadata = {
  isSynthetic: true;
  source: typeof E2E_SOURCE;
  batchId: string;
  generatedAt: string;
  scenarioId?: string;
  cohortId?: E2ECohortId;
  liveEmis: false;
};

export type E2EBatchManifest = E2ESyntheticMetadata & {
  seed: number;
  patientCount: number;
  userCount: number;
  organisationCount: number;
  labCount: number;
  pharmacyCount: number;
  patientStateFactCount: number;
  labEventCount: number;
  pharmacyEventCount: number;
  scenarioDistribution: Record<E2ECohortId, number>;
};

export type E2EOrganisationKind =
  | "primary_care"
  | "diabetes_clinic"
  | "specialist_centre"
  | "hospital"
  | "community"
  | "laboratory"
  | "pharmacy"
  | "virtual_care";

export type E2EOrganisation = {
  id: string;
  name: string;
  kind: E2EOrganisationKind;
  /** @deprecated Prefer organisationCode — retained for one-release compat. */
  odsCode: string;
  /** Region-agnostic organisation code (same value as odsCode today). */
  organisationCode: string;
  /** @deprecated Prefer regionId — example geography label only. */
  icsRegion: string;
  /** Region-agnostic region identifier (same value as icsRegion today). */
  regionId: string;
  metadata: E2ESyntheticMetadata;
};

export type E2EClinicianSpecialty =
  | "general_practice"
  | "endocrinology"
  | "diabetology"
  | "cardiology"
  | "nephrology"
  | "internal_medicine"
  | "emergency_medicine"
  | "ophthalmology"
  | "podiatry";

export type E2ECareTeamRole =
  | "primary_doctor"
  | "specialist"
  | "nurse"
  | "care_coordinator"
  | "pharmacist"
  | "dietitian"
  | "diabetes_educator";

export type E2EUserSubRole =
  | "gp"
  | "endocrinologist"
  | "diabetologist"
  | "cardiologist"
  | "nephrologist"
  | "internal_medicine"
  | "emergency_medicine"
  | "ophthalmologist"
  | "podiatrist"
  | "diabetes_specialist_nurse"
  | "practice_nurse"
  | "care_coordinator"
  | "community_nurse"
  | "dietitian"
  | "diabetes_educator"
  | "pharmacist"
  | "clinical_safety_officer"
  | "organisation_admin";

export type E2EUserSpec = {
  id: string;
  email: string;
  role: UserRole;
  subRole: E2EUserSubRole;
  specialty?: E2EClinicianSpecialty;
  fullName: string;
  organisationId: string | null;
  providerId: string;
  practiceOds: string | null;
  credentialsHint: string | null;
  workingHours: string;
  caseloadHint: string | null;
  metadata: E2ESyntheticMetadata;
};

export type E2EObservationPoint = {
  effectiveAt: string;
  value: number;
  unit: string;
  label: string;
};

export type E2EPatientProfile = {
  id: string;
  /**
   * Pre-unification generator ids that resolve to `id` (P1-ID-001).
   * Flagship cohort B emits canonical P002 with legacy alias E2P021.
   */
  legacyIds?: string[];
  name: string;
  /**
   * Synthetic national-format patient id for the demo region.
   * Region connectors may map a different identifier scheme later — not NHS-locked.
   */
  nhsNumber: string;
  /** Alias of nhsNumber — region-agnostic naming for publication surfaces. */
  nationalPatientId: string;
  dob: string;
  age: number;
  sex: "Female" | "Male" | "Non-binary";
  ethnicity: string;
  bmi: number;
  weightKg: number;
  heightCm: number;
  cohortId: E2ECohortId;
  organisationId: string;
  primaryDoctorId: string;
  careTeamIds: string[];
  conditions: string[];
  medications: string[];
  allergies: string[];
  comorbidities: string[];
  socialFactors: string[];
  careGoals: string[];
  preferences: string[];
  cgmAvailable: boolean;
  smokingStatus: "never" | "former" | "current";
  activityLevel: "low" | "moderate" | "high";
  adherenceScore: number | null;
  riskLevel: "low" | "moderate" | "high" | "very_high";
  hba1cSeries: E2EObservationPoint[];
  weightSeries: E2EObservationPoint[];
  bloodPressureSeries: { effectiveAt: string; systolic: number; diastolic: number }[];
  egfrSeries: E2EObservationPoint[];
  glucoseSeries: E2EObservationPoint[];
  lipidSeries: E2EObservationPoint[];
  cgmSummary?: {
    timeInRangePct: number;
    hypoEvents7d: number;
    effectiveAt: string;
  };
  missingDataFlags: string[];
  metadata: E2ESyntheticMetadata;
};

export type E2EPatientStateFactSeed = {
  id: string;
  patientId: string;
  factType: string;
  value: unknown;
  sourceSystem: string;
  sourceReference: string;
  confidence: number;
  effectiveAt: string;
  recordedAt: string;
};

export type E2ELabOrderStatus =
  | "ordered"
  | "received"
  | "processing"
  | "completed"
  | "delayed"
  | "amended"
  | "duplicate";

export type E2ELabResultFlag = "normal" | "abnormal" | "critical" | "missing";

export type E2ELabEvent = {
  id: string;
  orderId: string;
  laboratoryId: string;
  patientId: string;
  testCode: string;
  testName: string;
  status: E2ELabOrderStatus;
  resultFlag: E2ELabResultFlag;
  value: number | null;
  unit: string;
  orderedAt: string;
  resultedAt: string | null;
  metadata: E2ESyntheticMetadata;
};

export type E2EPharmacyEventKind =
  | "medication_request"
  | "dispensed"
  | "refill_due"
  | "missed_refill"
  | "adherence_issue"
  | "interaction_query"
  | "allergy_issue";

export type E2EPharmacyEvent = {
  id: string;
  pharmacyId: string;
  patientId: string;
  kind: E2EPharmacyEventKind;
  medication: string;
  status: "pending" | "completed" | "failed" | "blocked";
  occurredAt: string;
  metadata: E2ESyntheticMetadata;
};

export type E2EGeneratedDataset = {
  manifest: E2EBatchManifest;
  organisations: E2EOrganisation[];
  users: E2EUserSpec[];
  patients: E2EPatientProfile[];
  patientStateFacts: E2EPatientStateFactSeed[];
  labEvents: E2ELabEvent[];
  pharmacyEvents: E2EPharmacyEvent[];
};

export type E2EGeneratorOptions = {
  seed?: number;
  batchId?: string;
  numberOfPatients?: number;
  numberOfDoctors?: number;
  numberOfNurses?: number;
  numberOfLabs?: number;
  numberOfPharmacies?: number;
  monthsOfHistory?: number;
  organisationCount?: number;
};
