/**
 * Phase 3 — Medication and personalised care types.
 * Synthetic / simulation only. ehrWrite always false; no autonomous prescribe/adjust.
 * Interaction checks are a labeled synthetic stub — not a licensed drug database.
 */

import type { AllergyRecord, MedicationListItem, MedicationReconciliationRun } from "../patient-intelligence/types";
import type { MissingDataIndicator } from "./types";

export type MedCareReviewStatus = "DRAFT" | "APPROVED" | "REJECTED" | "SUPERSEDED";

export type MedCareDecisionAction = "accept" | "edit" | "reject";

export type InteractionSourceHonesty = {
  kind: "synthetic_stub";
  licensedDrugDatabase: false;
  label: string;
  note: string;
};

export type SyntheticInteractionFlag = {
  id: string;
  drugA: string;
  drugB: string;
  severity: "high" | "medium" | "low";
  /** Display-only reference string from synthetic fixture — not a live BNF lookup. */
  referenceLabel: string;
  recommendation: string;
  /** Always false until a licensed source is integrated under governance. */
  validatedCds: false;
  synthetic: true;
};

export type AllergyInteractionPanel = {
  allergies: AllergyRecord[];
  interactions: SyntheticInteractionFlag[];
  source: InteractionSourceHonesty;
};

export type MedicationSafetyFlagStatus = "pending_review" | "accepted" | "edited" | "rejected";

export type MedicationSafetyFlag = {
  id: string;
  patientId: string;
  code: string;
  severity: "high" | "medium" | "low" | "info";
  title: string;
  detail: string;
  relatedMedications: string[];
  status: MedicationSafetyFlagStatus;
  createdAt: string;
  decidedBy: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
  hitlRequired: true;
  ehrWrite: false;
  autonomousPrescribe: false;
  autonomousAdjust: false;
  validatedCds: false;
  synthetic: true;
};

export type CarePlanTemplateId =
  | "t2d_foundational"
  | "t2d_with_cvd_risk"
  | "insulin_education"
  | "polypharmacy_review";

export type CarePlanTemplate = {
  id: CarePlanTemplateId;
  title: string;
  description: string;
  sections: Array<{ id: string; title: string; clinical: boolean; itemTemplates: string[] }>;
  synthetic: true;
};

export type PersonalisedCarePlanSection = {
  id: string;
  title: string;
  items: string[];
  clinical: boolean;
};

export type PersonalisedCarePlan = {
  id: string;
  patientId: string;
  patientLabel: string;
  templateId: CarePlanTemplateId;
  title: string;
  status: MedCareReviewStatus;
  sections: PersonalisedCarePlanSection[];
  goalsLinked: string[];
  educationLinked: string[];
  createdBy: string;
  createdAt: string;
  decidedBy: string | null;
  decidedAt: string | null;
  decisionReason: string | null;
  version: number;
  /** INT-03 collapse — link to care_plan_records SoT when mirrored. */
  canonicalPlanId?: string | null;
  hitlRequired: true;
  ehrWrite: false;
  autonomousPrescribe: false;
  synthetic: true;
};

export type PatientGoalStatus = "proposed" | "active" | "achieved" | "paused" | "cancelled";

export type PatientGoal = {
  id: string;
  patientId: string;
  title: string;
  description: string;
  category: "glycaemia" | "lifestyle" | "medication_adherence" | "education" | "safety" | "other";
  status: PatientGoalStatus;
  targetDate: string | null;
  createdAt: string;
  updatedAt: string;
  synthetic: true;
};

export type EducationalResource = {
  id: string;
  title: string;
  summary: string;
  audience: "patient" | "carer" | "clinician";
  topics: string[];
  urlOrRef: string;
  /** Catalog is synthetic demo content — not a curated clinical content CMS. */
  synthetic: true;
};

export type CareTaskStatus = "open" | "in_progress" | "handed_off" | "completed" | "cancelled";

export type CareTeamHandoff = {
  id: string;
  patientId: string;
  fromRole: string;
  toRole: string;
  toMemberDisplay: string | null;
  summary: string;
  relatedTaskId: string | null;
  createdAt: string;
  acknowledgedAt: string | null;
  synthetic: true;
  ehrWrite: false;
};

export type AssignedCareTask = {
  id: string;
  patientId: string;
  title: string;
  description: string;
  ownerRole: string;
  ownerDisplay: string | null;
  status: CareTaskStatus;
  dueAt: string | null;
  relatedPlanId: string | null;
  relatedFlagId: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  note: string | null;
  synthetic: true;
  ehrWrite: false;
};

export type MedCareApprovalHistoryEntry = {
  id: string;
  patientId: string;
  subjectKind: "medication_safety_flag" | "personalised_care_plan" | "medication_reconciliation";
  subjectId: string;
  action: MedCareDecisionAction | "complete" | "cancel" | "create" | "handoff" | "task_update";
  actor: string;
  reason: string | null;
  createdAt: string;
  ehrWrite: false;
  synthetic: true;
  metadata?: Record<string, unknown>;
};

export type MedCareReviewSection = {
  id: string;
  title: string;
  items: string[];
  clinical: boolean;
};

export type MedicationSafetyReview = {
  id: string;
  patientId: string;
  patientLabel: string;
  status: MedCareReviewStatus;
  summarySections: MedCareReviewSection[];
  flagIds: string[];
  createdBy: string;
  createdAt: string;
  decidedBy: string | null;
  decidedAt: string | null;
  decisionReason: string | null;
  version: number;
  hitlRequired: true;
  ehrWrite: false;
  autonomousPrescribe: false;
  autonomousAdjust: false;
  validatedCds: false;
  synthetic: true;
};

export type MedCareReviewDecision = {
  id: string;
  reviewId: string;
  action: MedCareDecisionAction;
  actor: string;
  reason: string | null;
  editedSections: MedCareReviewSection[] | null;
  createdAt: string;
};

export type MedicationPersonalisedCareSnapshot = {
  patientId: string;
  patientLabel: string;
  synthetic: true;
  ehrWrite: false;
  hitlRequired: true;
  autonomousPrescribe: false;
  autonomousAdjust: false;
  clinicalValidationClaim: false;
  validatedCds: false;
  medications: MedicationListItem[];
  medicationReconciliations: MedicationReconciliationRun[];
  allergyInteractions: AllergyInteractionPanel;
  safetyFlags: MedicationSafetyFlag[];
  safetyReviews: MedicationSafetyReview[];
  carePlanTemplates: CarePlanTemplate[];
  carePlans: PersonalisedCarePlan[];
  goals: PatientGoal[];
  educationalResources: EducationalResource[];
  assignedTasks: AssignedCareTask[];
  handoffs: CareTeamHandoff[];
  approvalHistory: MedCareApprovalHistoryEntry[];
  missingData: MissingDataIndicator[];
  note: string;
};
