/**
 * Connected Diabetes Intelligence — vertical slice types.
 * Synthetic demo path only: ehrWrite always false; care plans require HITL.
 */

import type { ClinicalPersona } from "../user-scope";

export type CarePlanStatus = "DRAFT" | "APPROVED" | "REJECTED" | "SUPERSEDED";

export type CarePlanDecisionAction = "accept" | "edit" | "reject";

export type CareFollowUpStatus = "open" | "acknowledged" | "completed" | "cancelled";

export type MissingDataIndicator = {
  code: string;
  message: string;
  field?: string;
};

export type CarePlanSection = {
  id: string;
  title: string;
  items: string[];
  clinical: boolean;
};

export type CarePlanRecord = {
  id: string;
  patientId: string;
  patientLabel: string;
  status: CarePlanStatus;
  sections: CarePlanSection[];
  safetyNotes: string[];
  missingData: MissingDataIndicator[];
  createdBy: string;
  createdAt: string;
  decidedBy: string | null;
  /** INT-10 — clinical persona who signed Accept/Edit/Reject (null if unsigned / legacy). */
  decidedByPersona?: ClinicalPersona | null;
  decidedAt: string | null;
  decisionReason: string | null;
  version: number;
  /** INT-08 — practice/org FK when persisted; simulation default practice-demo. */
  organisationId?: string | null;
  hitlRequired: true;
  ehrWrite: false;
  synthetic: true;
};

export type CarePlanDecision = {
  id: string;
  planId: string;
  action: CarePlanDecisionAction;
  actor: string;
  /** INT-10 — who signed (gp / nurse / clinical-pharmacist). */
  actorPersona?: ClinicalPersona | null;
  reason: string | null;
  editedSections: CarePlanSection[] | null;
  createdAt: string;
};

export type CareFollowUpTask = {
  id: string;
  patientId: string;
  planId: string | null;
  title: string;
  owner: string;
  status: CareFollowUpStatus;
  dueAt: string;
  createdAt: string;
  acknowledgedAt: string | null;
  closedAt: string | null;
  note: string | null;
  organisationId?: string | null;
  synthetic: true;
};

export type JourneyTimelineEventKind =
  | "history"
  | "glucose"
  | "missing_data"
  | "care_plan_draft"
  | "care_plan_decision"
  | "follow_up"
  | "note";

export type JourneyTimelineEvent = {
  id: string;
  patientId: string;
  kind: JourneyTimelineEventKind;
  title: string;
  summary: string;
  occurredAt: string;
  ehrWrite: false;
  metadata?: Record<string, unknown>;
};

export type ClinicalHistorySnapshot = {
  conditions: string[];
  medications: string[];
  allergies: string[];
  missingFields: string[];
};

export type GlucoseObservation = {
  recordedAt: string;
  glucoseMgDl: number;
  context?: string;
};

export type GlucosePanel = {
  observations: GlucoseObservation[];
  missingData: MissingDataIndicator[];
  dataCompleteness: number;
};

export type DiabetesJourneySnapshot = {
  patientId: string;
  patientLabel: string;
  synthetic: true;
  ehrWrite: false;
  hitlRequired: true;
  history: ClinicalHistorySnapshot;
  glucose: GlucosePanel;
  carePlans: CarePlanRecord[];
  followUps: CareFollowUpTask[];
  timeline: JourneyTimelineEvent[];
};
