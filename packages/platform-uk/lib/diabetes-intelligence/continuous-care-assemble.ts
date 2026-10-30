/**
 * Assemble Phase 4 continuous care snapshots, worklists, and HITL flows.
 */

import { getPatientById } from "../mock-data";
import {
  decideEscalation,
  getNotificationPrefs,
  listAllEscalations,
  listAllFollowUpItems,
  listAllPatientUpdates,
  listAppointments,
  listCompletedActions,
  listDecisionHistory,
  listEscalations,
  listFollowUpItems,
  listPatientUpdates,
  listPlanProgress,
  replacePatientContinuousCareSeed,
  triagePatientUpdate,
  updateAppointmentStatus,
  updateFollowUpItem,
  updateNotificationPrefs,
  updatePlanProgress,
} from "./continuous-care-repository";
import { buildContinuousCareSeed } from "./continuous-care-seed";
import type {
  AppointmentStatus,
  ContinuousCareAnalytics,
  ContinuousCareDecisionAction,
  ContinuousCareSnapshot,
  ContinuousCareWorklistItem,
  FollowUpItemStatus,
  FollowUpPriority,
  FollowUpWorklistItem,
  NotificationPreferences,
  PatientUpdateStatus,
  PlanProgressStatus,
  StaffEscalationItem,
} from "./continuous-care-types";
import type { MissingDataIndicator } from "./types";

function patientLabel(patientId: string): string {
  return getPatientById(patientId)?.name?.trim() || patientId;
}

function priorityRank(p: FollowUpPriority): number {
  switch (p) {
    case "emergency":
      return 0;
    case "urgent":
      return 1;
    case "soon":
      return 2;
    default:
      return 3;
  }
}

function assessMissing(input: {
  followUps: number;
  prefs: boolean;
  progress: number;
  openEscalations: number;
}): MissingDataIndicator[] {
  const missing: MissingDataIndicator[] = [];
  if (input.followUps === 0) {
    missing.push({
      code: "followups_none",
      message: "No continuous-care follow-up worklist items — seed synthetic spine",
      field: "followUpWorklist",
    });
  }
  if (!input.prefs) {
    missing.push({
      code: "notification_prefs_missing",
      message: "Notification preferences not configured",
      field: "notificationPreferences",
    });
  }
  if (input.progress === 0) {
    missing.push({
      code: "plan_progress_none",
      message: "No care-plan progress monitoring rows",
      field: "carePlanProgress",
    });
  }
  if (input.openEscalations > 0) {
    missing.push({
      code: "escalations_open",
      message: `${input.openEscalations} escalation(s) awaiting clinician HITL`,
      field: "escalationQueue",
    });
  }
  return missing;
}

export function deriveContinuousCareAnalytics(input: {
  followUps: FollowUpWorklistItem[];
  escalations: StaffEscalationItem[];
  updates: { status: string }[];
  appointments: { status: string }[];
  completedActions: { completedAt: string }[];
  progress: { status: string }[];
  prefs: NotificationPreferences | null;
  nowMs?: number;
}): ContinuousCareAnalytics {
  const now = input.nowMs ?? Date.now();
  const weekAgo = now - 7 * 86400_000;
  const openFollowUps = input.followUps.filter((f) =>
    ["open", "in_progress", "acknowledged", "escalated"].includes(f.status)
  );
  const overdueFollowUps = openFollowUps.filter((f) => f.dueAt && Date.parse(f.dueAt) < now);
  const openEscalations = input.escalations.filter((e) =>
    ["DRAFT", "queued", "in_review", "accepted", "edited"].includes(e.status)
  );
  const highSeverityEscalations = openEscalations.filter((e) => e.severity === "high").length;
  const pendingPatientUpdates = input.updates.filter((u) =>
    ["submitted", "triaged"].includes(u.status)
  ).length;
  const appointmentsAwaitingConfirm = input.appointments.filter((a) =>
    ["proposed", "offered"].includes(a.status)
  ).length;
  const completedActions7d = input.completedActions.filter(
    (c) => Date.parse(c.completedAt) >= weekAgo
  ).length;
  const carePlansAtRisk = input.progress.filter((p) => p.status === "at_risk").length;
  const hitlPending = input.escalations.filter((e) => e.status === "DRAFT" || e.status === "queued")
    .length;
  const ages = openFollowUps.map((f) => (now - Date.parse(f.createdAt)) / 3600_000);
  const avgFollowUpAgeHours =
    ages.length > 0 ? Math.round((ages.reduce((a, b) => a + b, 0) / ages.length) * 10) / 10 : null;

  const closedFollowUps = input.followUps.filter((f) =>
    ["completed", "cancelled"].includes(f.status)
  ).length;
  const completionRate7d =
    input.followUps.length > 0
      ? Math.round((closedFollowUps / input.followUps.length) * 1000) / 1000
      : null;

  let notificationOptInRate: number | null = null;
  if (input.prefs) {
    const channels = Object.values(input.prefs.channels);
    const on = channels.filter(Boolean).length;
    notificationOptInRate = channels.length ? on / channels.length : null;
  }

  return {
    openFollowUps: openFollowUps.length,
    overdueFollowUps: overdueFollowUps.length,
    openEscalations: openEscalations.length,
    highSeverityEscalations,
    pendingPatientUpdates,
    appointmentsAwaitingConfirm,
    completedActions7d,
    carePlansAtRisk,
    hitlPending,
    avgFollowUpAgeHours,
    safety: {
      autonomousClinicalActions: 0,
      ehrWrites: 0,
      unverifiedPatientReports: input.updates.filter((u) => u.status !== "closed").length,
      escalationHitlRequiredRate: input.escalations.length
        ? input.escalations.filter((e) => e.hitlRequired).length / input.escalations.length
        : 1,
    },
    operational: {
      worklistDepth: openFollowUps.length + openEscalations.length + pendingPatientUpdates,
      completionRate7d,
      notificationOptInRate,
    },
    synthetic: true,
    clinicalValidationClaim: false,
  };
}

export async function buildContinuousCare(
  patientId: string,
  options?: { scopeKey?: string }
): Promise<ContinuousCareSnapshot> {
  const scopeKey = options?.scopeKey ?? "shared";
  const label = patientLabel(patientId);

  const [followUps, appointments, updates, prefs, escalations, completed, progress, history] =
    await Promise.all([
      listFollowUpItems(patientId, { scopeKey }),
      listAppointments(patientId, { scopeKey }),
      listPatientUpdates(patientId, { scopeKey }),
      getNotificationPrefs(patientId, { scopeKey }),
      listEscalations(patientId, { scopeKey }),
      listCompletedActions(patientId, { scopeKey }),
      listPlanProgress(patientId, { scopeKey }),
      listDecisionHistory(patientId, { scopeKey }),
    ]);

  const analytics = deriveContinuousCareAnalytics({
    followUps,
    escalations,
    updates,
    appointments,
    completedActions: completed,
    progress,
    prefs,
  });

  const missingData = assessMissing({
    followUps: followUps.length,
    prefs: Boolean(prefs),
    progress: progress.length,
    openEscalations: analytics.hitlPending,
  });

  return {
    patientId,
    patientLabel: label,
    synthetic: true,
    ehrWrite: false,
    hitlRequired: true,
    autonomousClinicalAction: false,
    clinicalValidationClaim: false,
    followUpWorklist: followUps,
    appointments,
    patientReportedUpdates: updates,
    notificationPreferences: prefs,
    escalationQueue: escalations,
    completedActions: completed,
    carePlanProgress: progress,
    decisionHistory: history,
    analytics,
    missingData,
    note:
      "Phase 4 continuous care — synthetic longitudinal ops; ehrWrite=false; no autonomous clinical actions; HITL on escalations; not clinically validated.",
  };
}

export async function seedAndBuildContinuousCare(
  patientId: string,
  options?: { scopeKey?: string; actor?: string; now?: number }
): Promise<ContinuousCareSnapshot> {
  const scopeKey = options?.scopeKey ?? "shared";
  const actor = options?.actor ?? "synthetic-seed";
  const now = options?.now ?? Date.now();
  const label = patientLabel(patientId);
  const seed = buildContinuousCareSeed(patientId, label, now, actor, scopeKey);
  await replacePatientContinuousCareSeed(patientId, seed, { scopeKey, actor });
  return buildContinuousCare(patientId, { scopeKey });
}

export async function advanceContinuousFollowUp(
  input: {
    patientId: string;
    itemId: string;
    status: FollowUpItemStatus;
    note?: string;
    actor: string;
  },
  options?: { scopeKey?: string }
): Promise<ContinuousCareSnapshot> {
  await updateFollowUpItem(input, options);
  return buildContinuousCare(input.patientId, options);
}

export async function advanceAppointment(
  input: {
    patientId: string;
    appointmentId: string;
    status: AppointmentStatus;
    note?: string;
    actor: string;
  },
  options?: { scopeKey?: string }
): Promise<ContinuousCareSnapshot> {
  await updateAppointmentStatus(input, options);
  return buildContinuousCare(input.patientId, options);
}

export async function advancePatientUpdate(
  input: {
    patientId: string;
    updateId: string;
    status: PatientUpdateStatus;
    note?: string;
    actor: string;
  },
  options?: { scopeKey?: string }
): Promise<ContinuousCareSnapshot> {
  await triagePatientUpdate(input, options);
  return buildContinuousCare(input.patientId, options);
}

export async function setContinuousNotificationPrefs(
  input: {
    patientId: string;
    channels?: NotificationPreferences["channels"];
    status?: NotificationPreferences["status"];
    topics?: string[];
    quietHours?: NotificationPreferences["quietHours"];
    actor: string;
  },
  options?: { scopeKey?: string }
): Promise<ContinuousCareSnapshot> {
  await updateNotificationPrefs(input, options);
  return buildContinuousCare(input.patientId, options);
}

export async function advanceCarePlanProgress(
  input: {
    patientId: string;
    progressId: string;
    status?: PlanProgressStatus;
    progressPct?: number;
    milestoneId?: string;
    milestoneDone?: boolean;
    actor: string;
  },
  options?: { scopeKey?: string }
): Promise<ContinuousCareSnapshot> {
  await updatePlanProgress(input, options);
  return buildContinuousCare(input.patientId, options);
}

export async function decideStaffEscalation(
  input: {
    patientId: string;
    escalationId: string;
    action: ContinuousCareDecisionAction;
    actor: string;
    reason?: string;
    editedNote?: string;
  },
  options?: { scopeKey?: string }
): Promise<
  ContinuousCareSnapshot & {
    shieldAuditWriteFailed?: boolean;
    shieldAuditWriteReason?: string | null;
  }
> {
  await decideEscalation(input, options);
  const { persistDiabetesDomainShieldDecision } = await import("./shield-decision-audit");
  const shield = await persistDiabetesDomainShieldDecision({
    source: "continuous_care",
    action: input.action,
    actor: input.actor,
    patientId: input.patientId,
    subjectId: input.escalationId,
    reason: input.reason,
  });
  const snap = await buildContinuousCare(input.patientId, options);
  return {
    ...snap,
    shieldAuditWriteFailed: shield.shieldAuditWriteFailed,
    shieldAuditWriteReason: shield.shieldAuditWriteReason,
  };
}

function worklistUrgencyFromItem(kind: ContinuousCareWorklistItem["kind"], priority: FollowUpPriority, dueAt: string | null, now: number): number {
  let base = priorityRank(priority) * 10;
  if (kind === "escalation") base -= 5;
  if (dueAt && Date.parse(dueAt) < now) base -= 3;
  return base;
}

export async function buildContinuousCareWorklist(options?: {
  scopeKey?: string;
  roleFilter?: string;
}): Promise<ContinuousCareWorklistItem[]> {
  const scopeKey = options?.scopeKey ?? "shared";
  const now = Date.now();
  const [followUps, escalations, updates] = await Promise.all([
    listAllFollowUpItems({ scopeKey }),
    listAllEscalations({ scopeKey }),
    listAllPatientUpdates({ scopeKey }),
  ]);

  const items: ContinuousCareWorklistItem[] = [];

  for (const f of followUps) {
    if (!["open", "in_progress", "acknowledged", "escalated"].includes(f.status)) continue;
    if (options?.roleFilter && f.ownerRole !== options.roleFilter) continue;
    items.push({
      id: f.id,
      patientId: f.patientId,
      patientLabel: f.patientLabel,
      kind: "follow_up",
      title: f.title,
      ownerRole: f.ownerRole,
      status: f.status,
      priority: f.priority,
      dueAt: f.dueAt,
      createdAt: f.createdAt,
      measurableOutcome: f.measurableOutcome,
      synthetic: true,
      ehrWrite: false,
      worklistUrgency: worklistUrgencyFromItem("follow_up", f.priority, f.dueAt, now),
    });
  }

  for (const e of escalations) {
    if (!["DRAFT", "queued", "in_review", "accepted", "edited"].includes(e.status)) continue;
    if (options?.roleFilter && e.ownerRole !== options.roleFilter) continue;
    const priority: FollowUpPriority =
      e.severity === "high" ? "urgent" : e.severity === "medium" ? "soon" : "routine";
    items.push({
      id: e.id,
      patientId: e.patientId,
      patientLabel: e.patientLabel,
      kind: "escalation",
      title: e.title,
      ownerRole: e.ownerRole,
      status: e.status,
      priority,
      dueAt: null,
      createdAt: e.createdAt,
      measurableOutcome: e.measurableOutcome,
      synthetic: true,
      ehrWrite: false,
      worklistUrgency: worklistUrgencyFromItem("escalation", priority, null, now),
    });
  }

  for (const u of updates) {
    if (!["submitted", "triaged"].includes(u.status)) continue;
    items.push({
      id: u.id,
      patientId: u.patientId,
      patientLabel: u.patientLabel,
      kind: "patient_update",
      title: `Patient update: ${u.category}`,
      ownerRole: "nurse",
      status: u.status,
      priority: "soon",
      dueAt: null,
      createdAt: u.createdAt,
      measurableOutcome: u.measurableOutcome,
      synthetic: true,
      ehrWrite: false,
      worklistUrgency: worklistUrgencyFromItem("patient_update", "soon", null, now),
    });
  }

  return items.sort(
    (a, b) => a.worklistUrgency - b.worklistUrgency || a.createdAt.localeCompare(b.createdAt)
  );
}
