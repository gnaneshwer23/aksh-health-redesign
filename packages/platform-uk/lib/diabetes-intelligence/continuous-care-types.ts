/**
 * Phase 4 — Continuous care / longitudinal operations types.
 * Synthetic / simulation only. ehrWrite always false; no autonomous clinical actions.
 * Every workflow carries owner, status, timestamps, decision history, measurable outcome.
 */

import type { MissingDataIndicator } from "./types";

export type ContinuousCareDecisionAction = "accept" | "edit" | "reject" | "resolve" | "queue";

export type MeasurableOutcome = {
  metric: string;
  value: string | number | boolean | null;
  unit?: string;
  /** null = pending / not yet measured */
  achieved: boolean | null;
};

export type WorkflowDecisionEntry = {
  id: string;
  action: string;
  actor: string;
  reason: string | null;
  at: string;
  measurableOutcome?: MeasurableOutcome | null;
};

export type FollowUpItemStatus =
  | "open"
  | "in_progress"
  | "acknowledged"
  | "escalated"
  | "completed"
  | "cancelled";

export type FollowUpSourceKind = "journey_follow_up" | "medcare_task" | "continuous_care" | "handoff";

export type FollowUpPriority = "emergency" | "urgent" | "soon" | "routine";

export type FollowUpWorklistItem = {
  id: string;
  patientId: string;
  patientLabel: string;
  title: string;
  sourceKind: FollowUpSourceKind;
  sourceRefId: string | null;
  ownerRole: string;
  ownerDisplay: string | null;
  status: FollowUpItemStatus;
  priority: FollowUpPriority;
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  decisionHistory: WorkflowDecisionEntry[];
  measurableOutcome: MeasurableOutcome;
  note: string | null;
  synthetic: true;
  ehrWrite: false;
  autonomousClinicalAction: false;
};

export type AppointmentModality = "in_person" | "telephone" | "video" | "async_message";

export type AppointmentStatus =
  | "proposed"
  | "offered"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type AppointmentCoordination = {
  id: string;
  patientId: string;
  patientLabel: string;
  title: string;
  modality: AppointmentModality;
  ownerRole: string;
  ownerDisplay: string | null;
  status: AppointmentStatus;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  relatedFollowUpId: string | null;
  decisionHistory: WorkflowDecisionEntry[];
  measurableOutcome: MeasurableOutcome;
  note: string | null;
  hitlRequired: true;
  synthetic: true;
  ehrWrite: false;
  autonomousClinicalAction: false;
};

export type PatientUpdateCategory = "symptoms" | "adherence" | "lifestyle" | "device" | "concern" | "other";

export type PatientUpdateStatus = "submitted" | "triaged" | "acknowledged" | "escalated" | "closed";

export type PatientReportedUpdate = {
  id: string;
  patientId: string;
  patientLabel: string;
  category: PatientUpdateCategory;
  summary: string;
  ownerRole: string;
  ownerDisplay: string | null;
  status: PatientUpdateStatus;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  decisionHistory: WorkflowDecisionEntry[];
  measurableOutcome: MeasurableOutcome;
  synthetic: true;
  ehrWrite: false;
  verifiedByClinician: false;
};

export type NotificationChannelPrefs = {
  email: boolean;
  sms: boolean;
  inApp: boolean;
  push: boolean;
};

export type NotificationPreferences = {
  id: string;
  patientId: string;
  ownerRole: string;
  ownerDisplay: string | null;
  status: "active" | "paused" | "withdrawn";
  channels: NotificationChannelPrefs;
  quietHours: { startLocal: string; endLocal: string } | null;
  topics: string[];
  createdAt: string;
  updatedAt: string;
  decisionHistory: WorkflowDecisionEntry[];
  measurableOutcome: MeasurableOutcome;
  synthetic: true;
  ehrWrite: false;
};

export type EscalationSeverity = "high" | "medium" | "low";

export type EscalationStatus =
  | "DRAFT"
  | "queued"
  | "in_review"
  | "accepted"
  | "edited"
  | "rejected"
  | "resolved"
  | "cancelled";

export type StaffEscalationItem = {
  id: string;
  patientId: string;
  patientLabel: string;
  title: string;
  reason: string;
  severity: EscalationSeverity;
  ownerRole: string;
  ownerDisplay: string | null;
  status: EscalationStatus;
  relatedFollowUpId: string | null;
  relatedUpdateId: string | null;
  createdAt: string;
  updatedAt: string;
  decidedBy: string | null;
  decidedAt: string | null;
  closedAt: string | null;
  decisionHistory: WorkflowDecisionEntry[];
  measurableOutcome: MeasurableOutcome;
  hitlRequired: true;
  synthetic: true;
  ehrWrite: false;
  autonomousClinicalAction: false;
};

export type EscalationDecision = {
  id: string;
  escalationId: string;
  action: ContinuousCareDecisionAction;
  actor: string;
  reason: string | null;
  editedNote: string | null;
  createdAt: string;
};

export type CompletedCareAction = {
  id: string;
  patientId: string;
  patientLabel: string;
  actionKind: string;
  title: string;
  ownerRole: string;
  ownerDisplay: string | null;
  status: "completed" | "voided";
  sourceKind: string;
  sourceRefId: string | null;
  completedAt: string;
  createdAt: string;
  decisionHistory: WorkflowDecisionEntry[];
  measurableOutcome: MeasurableOutcome;
  note: string | null;
  synthetic: true;
  ehrWrite: false;
};

export type PlanProgressStatus = "monitoring" | "on_track" | "at_risk" | "completed" | "paused";

export type CarePlanMilestone = {
  id: string;
  title: string;
  done: boolean;
  dueAt: string | null;
};

export type CarePlanProgress = {
  id: string;
  patientId: string;
  patientLabel: string;
  planRefKind: "journey_care_plan" | "medcare_care_plan" | "synthetic_plan";
  planRefId: string;
  title: string;
  ownerRole: string;
  ownerDisplay: string | null;
  status: PlanProgressStatus;
  progressPct: number;
  milestones: CarePlanMilestone[];
  createdAt: string;
  updatedAt: string;
  decisionHistory: WorkflowDecisionEntry[];
  measurableOutcome: MeasurableOutcome;
  synthetic: true;
  ehrWrite: false;
};

export type ContinuousCareHistoryEntry = {
  id: string;
  patientId: string;
  subjectKind:
    | "follow_up"
    | "appointment"
    | "patient_update"
    | "notification_pref"
    | "escalation"
    | "completed_action"
    | "plan_progress";
  subjectId: string;
  action: string;
  actor: string;
  reason: string | null;
  createdAt: string;
  measurableOutcome: MeasurableOutcome | null;
  ehrWrite: false;
  synthetic: true;
  metadata?: Record<string, unknown>;
};

/** Derived operational + safety analytics — synthetic demo metrics only. */
export type ContinuousCareAnalytics = {
  openFollowUps: number;
  overdueFollowUps: number;
  openEscalations: number;
  highSeverityEscalations: number;
  pendingPatientUpdates: number;
  appointmentsAwaitingConfirm: number;
  completedActions7d: number;
  carePlansAtRisk: number;
  hitlPending: number;
  avgFollowUpAgeHours: number | null;
  safety: {
    autonomousClinicalActions: 0;
    ehrWrites: 0;
    unverifiedPatientReports: number;
    escalationHitlRequiredRate: number;
  };
  operational: {
    worklistDepth: number;
    completionRate7d: number | null;
    notificationOptInRate: number | null;
  };
  synthetic: true;
  clinicalValidationClaim: false;
};

export type ContinuousCareWorklistItem = {
  id: string;
  patientId: string;
  patientLabel: string;
  kind: "follow_up" | "escalation" | "patient_update" | "appointment";
  title: string;
  ownerRole: string;
  status: string;
  priority: FollowUpPriority;
  dueAt: string | null;
  createdAt: string;
  measurableOutcome: MeasurableOutcome;
  synthetic: true;
  ehrWrite: false;
  worklistUrgency: number;
};

export type ContinuousCareSnapshot = {
  patientId: string;
  patientLabel: string;
  synthetic: true;
  ehrWrite: false;
  hitlRequired: true;
  autonomousClinicalAction: false;
  clinicalValidationClaim: false;
  followUpWorklist: FollowUpWorklistItem[];
  appointments: AppointmentCoordination[];
  patientReportedUpdates: PatientReportedUpdate[];
  notificationPreferences: NotificationPreferences | null;
  escalationQueue: StaffEscalationItem[];
  completedActions: CompletedCareAction[];
  carePlanProgress: CarePlanProgress[];
  decisionHistory: ContinuousCareHistoryEntry[];
  analytics: ContinuousCareAnalytics;
  missingData: MissingDataIndicator[];
  note: string;
};
