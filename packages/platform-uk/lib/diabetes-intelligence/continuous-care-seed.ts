/**
 * Synthetic seed fixtures for Phase 4 continuous care.
 */

import type {
  AppointmentCoordination,
  CarePlanProgress,
  FollowUpWorklistItem,
  MeasurableOutcome,
  NotificationPreferences,
  PatientReportedUpdate,
  StaffEscalationItem,
  WorkflowDecisionEntry,
} from "./continuous-care-types";
import { scopedSyntheticId } from "./org-tenancy";

function outcome(
  metric: string,
  value: MeasurableOutcome["value"],
  achieved: boolean | null,
  unit?: string
): MeasurableOutcome {
  return { metric, value, unit, achieved };
}

function decision(
  id: string,
  action: string,
  actor: string,
  at: string,
  reason: string | null = null
): WorkflowDecisionEntry {
  return { id, action, actor, reason, at };
}

export function buildContinuousCareSeed(
  patientId: string,
  patientLabel: string,
  nowMs: number,
  actor: string,
  scopeKey = "shared"
): {
  followUps: FollowUpWorklistItem[];
  appointments: AppointmentCoordination[];
  updates: PatientReportedUpdate[];
  notificationPrefs: NotificationPreferences;
  escalations: StaffEscalationItem[];
  progress: CarePlanProgress[];
} {
  const now = new Date(nowMs).toISOString();
  const dueSoon = new Date(nowMs + 2 * 86400_000).toISOString();
  const dueLater = new Date(nowMs + 14 * 86400_000).toISOString();
  const overdue = new Date(nowMs - 1 * 86400_000).toISOString();
  const apptAt = new Date(nowMs + 5 * 86400_000).toISOString();
  const sid = (bare: string) => scopedSyntheticId(scopeKey, bare);

  const fuJourneyId = sid(`ccfu-${patientId}-journey`);
  const fuMedId = sid(`ccfu-${patientId}-medcare`);
  const fuNurseId = sid(`ccfu-${patientId}-nurse`);
  const updId = sid(`ccupd-${patientId}-1`);
  const escId = sid(`ccesc-${patientId}-1`);
  const apptId = sid(`ccappt-${patientId}-1`);
  const progId = sid(`ccprog-${patientId}-1`);

  const followUps: FollowUpWorklistItem[] = [
    {
      id: fuJourneyId,
      patientId,
      patientLabel,
      title: "Confirm diabetes care-plan follow-up (journey)",
      sourceKind: "journey_follow_up",
      sourceRefId: sid(`cfu-${patientId}-synthetic`),
      ownerRole: "gp",
      ownerDisplay: "Named GP",
      status: "open",
      priority: "soon",
      dueAt: dueSoon,
      createdAt: now,
      updatedAt: now,
      closedAt: null,
      decisionHistory: [decision(`d-${fuJourneyId}-create`, "create", actor, now, "Seeded from journey pattern")],
      measurableOutcome: outcome("follow_up_completed", false, null),
      note: "Reuses diabetes-journey follow-up pattern — synthetic",
      synthetic: true,
      ehrWrite: false,
      autonomousClinicalAction: false,
    },
    {
      id: fuMedId,
      patientId,
      patientLabel,
      title: "Medicines counselling after medcare handoff",
      sourceKind: "medcare_task",
      sourceRefId: sid(`task-${patientId}-med-recon`),
      ownerRole: "clinical-pharmacist",
      ownerDisplay: "Practice pharmacist (synthetic)",
      status: "open",
      priority: "routine",
      dueAt: dueLater,
      createdAt: now,
      updatedAt: now,
      closedAt: null,
      decisionHistory: [decision(`d-${fuMedId}-create`, "create", actor, now, "Seeded from medcare task")],
      measurableOutcome: outcome("counselling_documented", false, null),
      note: "Reuses medication-care assigned task / handoff — synthetic",
      synthetic: true,
      ehrWrite: false,
      autonomousClinicalAction: false,
    },
    {
      id: fuNurseId,
      patientId,
      patientLabel,
      title: "Nurse review of overdue patient-reported concern",
      sourceKind: "continuous_care",
      sourceRefId: updId,
      ownerRole: "nurse",
      ownerDisplay: "Diabetes nurse (synthetic)",
      status: "open",
      priority: "urgent",
      dueAt: overdue,
      createdAt: now,
      updatedAt: now,
      closedAt: null,
      decisionHistory: [decision(`d-${fuNurseId}-create`, "create", actor, now)],
      measurableOutcome: outcome("nurse_triage_completed", false, null),
      note: null,
      synthetic: true,
      ehrWrite: false,
      autonomousClinicalAction: false,
    },
  ];

  const appointments: AppointmentCoordination[] = [
    {
      id: apptId,
      patientId,
      patientLabel,
      title: "Diabetes review appointment (coordination)",
      modality: "telephone",
      ownerRole: "gp",
      ownerDisplay: "Named GP",
      status: "proposed",
      scheduledAt: apptAt,
      createdAt: now,
      updatedAt: now,
      closedAt: null,
      relatedFollowUpId: fuJourneyId,
      decisionHistory: [decision(`d-${apptId}-propose`, "propose", actor, now)],
      measurableOutcome: outcome("appointment_attended", false, null),
      note: "Slot coordination only — no live booking connector claimed",
      hitlRequired: true,
      synthetic: true,
      ehrWrite: false,
      autonomousClinicalAction: false,
    },
  ];

  const updates: PatientReportedUpdate[] = [
    {
      id: updId,
      patientId,
      patientLabel,
      category: "concern",
      summary: "Patient-reported nocturnal hypo symptoms ×2 last week (unverified).",
      ownerRole: "patient",
      ownerDisplay: patientLabel,
      status: "submitted",
      createdAt: now,
      updatedAt: now,
      closedAt: null,
      decisionHistory: [decision(`d-${updId}-submit`, "submit", "patient-synthetic", now)],
      measurableOutcome: outcome("clinician_ack", false, null),
      synthetic: true,
      ehrWrite: false,
      verifiedByClinician: false,
    },
  ];

  const notificationPrefs: NotificationPreferences = {
    id: sid(`ccpref-${patientId}`),
    patientId,
    ownerRole: "patient",
    ownerDisplay: patientLabel,
    status: "active",
    channels: { email: true, sms: false, inApp: true, push: false },
    quietHours: { startLocal: "21:00", endLocal: "07:00" },
    topics: ["appointment_reminders", "follow_up_due", "escalation_ack"],
    createdAt: now,
    updatedAt: now,
    decisionHistory: [decision(`d-ccpref-${patientId}-set`, "set_preferences", actor, now)],
    measurableOutcome: outcome("channels_configured", true, true),
    synthetic: true,
    ehrWrite: false,
  };

  const escalations: StaffEscalationItem[] = [
    {
      id: escId,
      patientId,
      patientLabel,
      title: "Escalate nocturnal hypo concern to nurse queue",
      reason:
        "Patient-reported nocturnal hypos — draft escalation for clinician triage. No autonomous outreach.",
      severity: "high",
      ownerRole: "nurse",
      ownerDisplay: "Diabetes nurse (synthetic)",
      status: "DRAFT",
      relatedFollowUpId: fuNurseId,
      relatedUpdateId: updId,
      createdAt: now,
      updatedAt: now,
      decidedBy: null,
      decidedAt: null,
      closedAt: null,
      decisionHistory: [decision(`d-${escId}-draft`, "draft", actor, now)],
      measurableOutcome: outcome("escalation_resolved_safely", false, null),
      hitlRequired: true,
      synthetic: true,
      ehrWrite: false,
      autonomousClinicalAction: false,
    },
  ];

  const progress: CarePlanProgress[] = [
    {
      id: progId,
      patientId,
      patientLabel,
      planRefKind: "synthetic_plan",
      planRefId: `plan-${patientId}-synthetic`,
      title: "T2D foundational care-plan progress (synthetic)",
      ownerRole: "gp",
      ownerDisplay: "Named GP",
      status: "monitoring",
      progressPct: 35,
      milestones: [
        { id: "m1", title: "Care plan accepted (HITL)", done: true, dueAt: null },
        { id: "m2", title: "Follow-up scheduled", done: false, dueAt: dueSoon },
        { id: "m3", title: "Patient goals reviewed", done: false, dueAt: dueLater },
        { id: "m4", title: "Safety escalation cleared", done: false, dueAt: dueSoon },
      ],
      createdAt: now,
      updatedAt: now,
      decisionHistory: [decision(`d-${progId}-monitor`, "start_monitoring", actor, now)],
      measurableOutcome: outcome("milestones_complete_pct", 25, null, "%"),
      synthetic: true,
      ehrWrite: false,
    },
  ];

  return { followUps, appointments, updates, notificationPrefs, escalations, progress };
}
