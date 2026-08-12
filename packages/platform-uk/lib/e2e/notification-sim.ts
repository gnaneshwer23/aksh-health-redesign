/**
 * Clinic notification + care-coordinator task board (SIMULATED).
 * Ensures handoffs are visible and closable — no silent fake success.
 */

export const NOTIFICATION_SIM_HONESTY = {
  livePush: false as const,
  liveEmis: false as const,
  ehrWrite: false as const,
  note: "Simulated in-app notifications — not SMS/email/push provider delivery.",
} as const;

export type NotificationKind =
  | "appointment_reminder"
  | "lab_delayed"
  | "lab_critical"
  | "pharmacy_adherence"
  | "cgm_safety"
  | "referral_draft"
  | "consent_revoked"
  | "no_show_chase"
  | "nurse_followup";

export type SimulatedNotification = {
  id: string;
  patientId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  audienceRole: "gp" | "nurse" | "care_coordinator" | "pharmacist" | "patient" | "admin";
  status: "unread" | "read" | "actioned";
  correlationId: string;
  createdAt: string;
  livePush: false;
  ehrWrite: false;
};

export type CoordinatorTaskKind =
  | "no_show_chase"
  | "pharmacy_adherence"
  | "lab_delay_chase"
  | "cgm_safety_followup"
  | "referral_packaging"
  | "consent_followup";

export type CoordinatorTask = {
  id: string;
  patientId: string;
  kind: CoordinatorTaskKind;
  status: "open" | "in_progress" | "done" | "escalated";
  assigneeRole: "care_coordinator" | "nurse" | "gp";
  summary: string;
  sourceNotificationId: string | null;
  correlationId: string;
  createdAt: string;
  updatedAt: string;
  hitlRequired: true;
  ehrWrite: false;
};

export function emitNotification(input: {
  patientId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  audienceRole: SimulatedNotification["audienceRole"];
  correlationId: string;
  at?: string;
}): SimulatedNotification {
  return {
    id: `e2e-notif-${input.kind}-${input.correlationId.slice(-8)}-${input.audienceRole}`,
    patientId: input.patientId,
    kind: input.kind,
    title: input.title,
    body: `${input.body} · SIMULATED (livePush:false)`,
    audienceRole: input.audienceRole,
    status: "unread",
    correlationId: input.correlationId,
    createdAt: input.at ?? new Date().toISOString(),
    livePush: false,
    ehrWrite: false,
  };
}

export function markNotificationActioned(
  notification: SimulatedNotification,
  at?: string
): SimulatedNotification {
  return {
    ...notification,
    status: "actioned",
    body: `${notification.body} · actioned@${at ?? new Date().toISOString()}`,
  };
}

export function openCoordinatorTask(input: {
  patientId: string;
  kind: CoordinatorTaskKind;
  summary: string;
  correlationId: string;
  sourceNotificationId?: string | null;
  assigneeRole?: CoordinatorTask["assigneeRole"];
  at?: string;
}): CoordinatorTask {
  const at = input.at ?? new Date().toISOString();
  return {
    id: `e2e-cco-task-${input.kind}-${input.correlationId.slice(-8)}`,
    patientId: input.patientId,
    kind: input.kind,
    status: "open",
    assigneeRole: input.assigneeRole ?? "care_coordinator",
    summary: input.summary,
    sourceNotificationId: input.sourceNotificationId ?? null,
    correlationId: input.correlationId,
    createdAt: at,
    updatedAt: at,
    hitlRequired: true,
    ehrWrite: false,
  };
}

export function progressCoordinatorTask(
  task: CoordinatorTask,
  status: Exclude<CoordinatorTask["status"], "open">,
  actor: string,
  at?: string
): CoordinatorTask {
  return {
    ...task,
    status,
    updatedAt: at ?? new Date().toISOString(),
    summary: `${task.summary} · ${status} by ${actor}`,
  };
}
