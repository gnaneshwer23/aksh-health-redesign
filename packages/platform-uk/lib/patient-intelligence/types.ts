/**
 * Unified patient intelligence foundation (Phase 1).
 * Synthetic / simulation spine — ehrWrite always false; no autonomous prescribing.
 */

export type Provenance = {
  sourceSystem: string;
  sourceReference?: string;
  confidence: number;
  recordedAt: string;
};

export type QualityFlag = "ok" | "stale" | "unverified" | "conflict" | "missing" | "unassessed";

export type QualityIndicator = {
  code: string;
  message: string;
  flag: QualityFlag;
  field?: string;
};

export type ConditionRecord = {
  id: string;
  patientId: string;
  display: string;
  code: string | null;
  codeSystem: string | null;
  clinicalStatus: "active" | "inactive" | "resolved" | "unknown";
  category: "problem" | "comorbidity" | "diabetes" | "other";
  onsetDate: string | null;
  provenance: Provenance;
  synthetic: true;
};

export type AllergyRecord = {
  id: string;
  patientId: string;
  substance: string;
  code: string | null;
  codeSystem: string | null;
  criticality: "low" | "high" | "unable_to_assess" | "unknown";
  reaction: string | null;
  clinicalStatus: "active" | "inactive" | "resolved" | "unknown";
  provenance: Provenance;
  synthetic: true;
};

export type FamilyHistoryRecord = {
  id: string;
  patientId: string;
  relationship: string;
  conditionDisplay: string;
  conditionCode: string | null;
  codeSystem: string | null;
  onsetAgeYears: number | null;
  notes: string | null;
  provenance: Provenance;
  synthetic: true;
};

export type DiabetesType =
  | "type_1"
  | "type_2"
  | "gestational"
  | "modynam"
  | "secondary"
  | "prediabetes"
  | "unspecified"
  | "none";

export type DiabetesProfile = {
  id: string;
  patientId: string;
  diabetesType: DiabetesType;
  classificationNote: string | null;
  diagnosedOn: string | null;
  snomedCode: string | null;
  status: "active" | "resolved" | "in_remission" | "unknown";
  provenance: Provenance;
  synthetic: true;
};

export type EncounterRecord = {
  id: string;
  patientId: string;
  className: string;
  reason: string | null;
  clinicianSummary: string | null;
  status: "planned" | "in_progress" | "finished" | "cancelled";
  startedAt: string;
  endedAt: string | null;
  provenance: Provenance;
  synthetic: true;
};

export type ObservationItem = {
  id: string;
  patientId: string;
  kind: string;
  display: string;
  valueNumeric: number | null;
  valueText: string | null;
  unit: string | null;
  code: string | null;
  codeSystem: string | null;
  observedAt: string;
  sourceChannel: string | null;
  verified: boolean;
  qualityFlag: QualityFlag;
  provenance: Provenance;
  synthetic: true;
};

export type MedicationListItem = {
  name: string;
  dose?: string;
  status?: "active" | "stopped" | "proposed" | "unknown";
  source?: string;
};

export type MedReconDiscrepancy = {
  code: string;
  message: string;
  medication?: string;
};

/** INT-04 — which dual entry surface started the run (single physical store). */
export type MedReconEntrySurface = "patient360" | "medcare" | "shared";

export type MedicationReconciliationRun = {
  id: string;
  patientId: string;
  status: "draft" | "in_progress" | "pending_clinician" | "completed" | "cancelled";
  sourceList: MedicationListItem[];
  reconciledList: MedicationListItem[];
  discrepancies: MedReconDiscrepancy[];
  createdBy: string;
  createdAt: string;
  decidedBy: string | null;
  decidedAt: string | null;
  note: string | null;
  /** Which UI/API surface started the run; null/legacy rows inferred from note. */
  entrySurface: MedReconEntrySurface | null;
  hitlRequired: true;
  ehrWrite: false;
  autonomousPrescribe: false;
  synthetic: true;
};

/** Infer entry surface for pre-INT-04 rows that lack `entry_surface`. */
export function inferMedReconEntrySurface(note: string | null | undefined): MedReconEntrySurface {
  const n = (note ?? "").toLowerCase();
  if (n.includes("medication-care") || n.includes("phase 3") || n.includes("medcare")) {
    return "medcare";
  }
  if (n.includes("patient-360") || n.includes("patient 360") || n.includes("scaffolding only")) {
    return "patient360";
  }
  return "shared";
}

export type CareAssignment = {
  id: string;
  patientId: string;
  memberDisplay: string;
  careRole: string;
  memberEmail: string | null;
  status: "active" | "ended";
  assignedAt: string;
  endedAt: string | null;
  synthetic: true;
};

export type SharingPreference = {
  id: string;
  patientId: string;
  purpose:
    | "direct_care"
    | "care_coordination"
    | "contact"
    | "research"
    | "data_sharing"
    | "device_data";
  status: "granted" | "withdrawn" | "denied";
  basis: string | null;
  recordedBy: string | null;
  recordedAt: string;
  synthetic: true;
};

export type TimelineEventKind =
  | "identity"
  | "condition"
  | "allergy"
  | "family_history"
  | "diabetes"
  | "encounter"
  | "observation"
  | "medication_recon"
  | "consent"
  | "care_team"
  | "quality"
  | "journey"
  | "glucose_intelligence"
  | "medcare"
  | "agent_intelligence";

export type PatientTimelineEvent = {
  id: string;
  patientId: string;
  kind: TimelineEventKind;
  title: string;
  summary: string;
  occurredAt: string;
  ehrWrite: false;
  metadata?: Record<string, unknown>;
};

export type PatientIdentity = {
  patientId: string;
  displayName: string;
  nhsNumber: string | null;
  dateOfBirth: string | null;
  sex: string | null;
  organisation: string | null;
};

export type Patient360Profile = {
  patientId: string;
  identity: PatientIdentity;
  diabetes: DiabetesProfile | null;
  conditions: ConditionRecord[];
  allergies: AllergyRecord[];
  familyHistory: FamilyHistoryRecord[];
  medications: MedicationListItem[];
  medicationReconciliations: MedicationReconciliationRun[];
  encounters: EncounterRecord[];
  observations: ObservationItem[];
  careTeam: CareAssignment[];
  sharingPreferences: SharingPreference[];
  timeline: PatientTimelineEvent[];
  qualityIndicators: QualityIndicator[];
  dataCompleteness: number;
  synthetic: true;
  ehrWrite: false;
  hitlRequired: true;
  autonomousPrescribe: false;
  note: string;
};
