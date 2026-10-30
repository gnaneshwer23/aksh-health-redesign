/**
 * Phase 4 continuous care persistence (file store + optional local-dev PG).
 */

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import { getPgPool, isPostgresConfigured } from "../db/client";
import type {
  AppointmentCoordination,
  AppointmentStatus,
  CarePlanProgress,
  CompletedCareAction,
  ContinuousCareDecisionAction,
  ContinuousCareHistoryEntry,
  EscalationDecision,
  FollowUpItemStatus,
  FollowUpWorklistItem,
  MeasurableOutcome,
  NotificationPreferences,
  PatientReportedUpdate,
  PatientUpdateStatus,
  PlanProgressStatus,
  StaffEscalationItem,
  WorkflowDecisionEntry,
} from "./continuous-care-types";

type Store = {
  followUps: FollowUpWorklistItem[];
  appointments: AppointmentCoordination[];
  updates: PatientReportedUpdate[];
  notificationPrefs: NotificationPreferences[];
  escalations: StaffEscalationItem[];
  escalationDecisions: EscalationDecision[];
  completedActions: CompletedCareAction[];
  progress: CarePlanProgress[];
  history: ContinuousCareHistoryEntry[];
};

const dataDir = path.join(process.cwd(), "data");

function resolveFile(scopeKey = "shared") {
  const safe = /^[a-zA-Z0-9_-]{3,64}$/.test(scopeKey) ? scopeKey : "shared";
  return path.join(
    dataDir,
    safe === "shared" ? "continuous-care.json" : `continuous-care.${safe}.json`
  );
}

async function readStore(scopeKey: string): Promise<Store> {
  const file = resolveFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  try {
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw) as Partial<Store>;
    return {
      followUps: Array.isArray(parsed.followUps) ? parsed.followUps : [],
      appointments: Array.isArray(parsed.appointments) ? parsed.appointments : [],
      updates: Array.isArray(parsed.updates) ? parsed.updates : [],
      notificationPrefs: Array.isArray(parsed.notificationPrefs) ? parsed.notificationPrefs : [],
      escalations: Array.isArray(parsed.escalations) ? parsed.escalations : [],
      escalationDecisions: Array.isArray(parsed.escalationDecisions) ? parsed.escalationDecisions : [],
      completedActions: Array.isArray(parsed.completedActions) ? parsed.completedActions : [],
      progress: Array.isArray(parsed.progress) ? parsed.progress : [],
      history: Array.isArray(parsed.history) ? parsed.history : [],
    };
  } catch {
    return {
      followUps: [],
      appointments: [],
      updates: [],
      notificationPrefs: [],
      escalations: [],
      escalationDecisions: [],
      completedActions: [],
      progress: [],
      history: [],
    };
  }
}

async function writeStore(store: Store, scopeKey: string) {
  const file = resolveFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  await writeFile(file, JSON.stringify(store, null, 2), "utf8");
}

function usePg(): boolean {
  return isPostgresConfigured();
}

function nowIso() {
  return new Date().toISOString();
}

function hist(
  patientId: string,
  subjectKind: ContinuousCareHistoryEntry["subjectKind"],
  subjectId: string,
  action: string,
  actor: string,
  reason: string | null,
  measurableOutcome: MeasurableOutcome | null = null,
  metadata?: Record<string, unknown>
): ContinuousCareHistoryEntry {
  return {
    id: `cch-${randomUUID()}`,
    patientId,
    subjectKind,
    subjectId,
    action,
    actor,
    reason,
    createdAt: nowIso(),
    measurableOutcome,
    ehrWrite: false,
    synthetic: true,
    metadata,
  };
}

export async function replacePatientContinuousCareSeed(
  patientId: string,
  seed: {
    followUps: FollowUpWorklistItem[];
    appointments: AppointmentCoordination[];
    updates: PatientReportedUpdate[];
    notificationPrefs: NotificationPreferences;
    escalations: StaffEscalationItem[];
    progress: CarePlanProgress[];
  },
  options?: { scopeKey?: string; actor?: string }
): Promise<void> {
  const scopeKey = options?.scopeKey ?? "shared";
  const actor = options?.actor ?? "synthetic-seed";

  // File store is the simulation path used by unit tests; PG is optional local-dev only.
  if (usePg()) {
    const pool = getPgPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const table of [
        "ccare_follow_up_items",
        "ccare_appointments",
        "ccare_patient_updates",
        "ccare_notification_prefs",
        "ccare_escalations",
        "ccare_completed_actions",
        "ccare_plan_progress",
      ]) {
        await client.query(`DELETE FROM aksh.${table} WHERE scope_key=$1 AND patient_id=$2`, [
          scopeKey,
          patientId,
        ]);
      }
      for (const f of seed.followUps) {
        await client.query(
          `INSERT INTO aksh.ccare_follow_up_items
            (id, scope_key, patient_id, patient_label, title, source_kind, source_ref_id,
             owner_role, owner_display, status, priority, due_at, created_at, updated_at,
             closed_at, measurable_outcome, note, synthetic, ehr_write, autonomous_clinical_action)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb,$17,TRUE,FALSE,FALSE)
           ON CONFLICT (id) DO UPDATE SET scope_key = EXCLUDED.scope_key, patient_id = EXCLUDED.patient_id`,
          [
            f.id,
            scopeKey,
            f.patientId,
            f.patientLabel,
            f.title,
            f.sourceKind,
            f.sourceRefId,
            f.ownerRole,
            f.ownerDisplay,
            f.status,
            f.priority,
            f.dueAt,
            f.createdAt,
            f.updatedAt,
            f.closedAt,
            JSON.stringify(f.measurableOutcome),
            f.note,
          ]
        );
      }
      for (const a of seed.appointments) {
        await client.query(
          `INSERT INTO aksh.ccare_appointments
            (id, scope_key, patient_id, patient_label, title, modality, owner_role, owner_display,
             status, scheduled_at, created_at, updated_at, closed_at, related_follow_up_id,
             measurable_outcome, note, hitl_required, synthetic, ehr_write, autonomous_clinical_action)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb,$16,TRUE,TRUE,FALSE,FALSE)
           ON CONFLICT (id) DO UPDATE SET scope_key = EXCLUDED.scope_key, patient_id = EXCLUDED.patient_id`,
          [
            a.id,
            scopeKey,
            a.patientId,
            a.patientLabel,
            a.title,
            a.modality,
            a.ownerRole,
            a.ownerDisplay,
            a.status,
            a.scheduledAt,
            a.createdAt,
            a.updatedAt,
            a.closedAt,
            a.relatedFollowUpId,
            JSON.stringify(a.measurableOutcome),
            a.note,
          ]
        );
      }
      for (const u of seed.updates) {
        await client.query(
          `INSERT INTO aksh.ccare_patient_updates
            (id, scope_key, patient_id, patient_label, category, summary, owner_role, owner_display,
             status, created_at, updated_at, closed_at, measurable_outcome, synthetic, ehr_write, verified_by_clinician)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,TRUE,FALSE,FALSE)
           ON CONFLICT (id) DO UPDATE SET scope_key = EXCLUDED.scope_key, patient_id = EXCLUDED.patient_id`,
          [
            u.id,
            scopeKey,
            u.patientId,
            u.patientLabel,
            u.category,
            u.summary,
            u.ownerRole,
            u.ownerDisplay,
            u.status,
            u.createdAt,
            u.updatedAt,
            u.closedAt,
            JSON.stringify(u.measurableOutcome),
          ]
        );
      }
      const p = seed.notificationPrefs;
      await client.query(
        `INSERT INTO aksh.ccare_notification_prefs
          (id, scope_key, patient_id, owner_role, owner_display, status, channels, quiet_hours,
           topics, created_at, updated_at, measurable_outcome, synthetic, ehr_write)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::jsonb,$10,$11,$12::jsonb,TRUE,FALSE)
         ON CONFLICT (id) DO UPDATE SET scope_key = EXCLUDED.scope_key, patient_id = EXCLUDED.patient_id`,
        [
          p.id,
          scopeKey,
          p.patientId,
          p.ownerRole,
          p.ownerDisplay,
          p.status,
          JSON.stringify(p.channels),
          p.quietHours ? JSON.stringify(p.quietHours) : null,
          JSON.stringify(p.topics),
          p.createdAt,
          p.updatedAt,
          JSON.stringify(p.measurableOutcome),
        ]
      );
      for (const e of seed.escalations) {
        await client.query(
          `INSERT INTO aksh.ccare_escalations
            (id, scope_key, patient_id, patient_label, title, reason, severity, owner_role, owner_display,
             status, related_follow_up_id, related_update_id, created_at, updated_at, decided_by, decided_at,
             closed_at, measurable_outcome, hitl_required, synthetic, ehr_write, autonomous_clinical_action)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18::jsonb,TRUE,TRUE,FALSE,FALSE)
           ON CONFLICT (id) DO UPDATE SET scope_key = EXCLUDED.scope_key, patient_id = EXCLUDED.patient_id`,
          [
            e.id,
            scopeKey,
            e.patientId,
            e.patientLabel,
            e.title,
            e.reason,
            e.severity,
            e.ownerRole,
            e.ownerDisplay,
            e.status,
            e.relatedFollowUpId,
            e.relatedUpdateId,
            e.createdAt,
            e.updatedAt,
            e.decidedBy,
            e.decidedAt,
            e.closedAt,
            JSON.stringify(e.measurableOutcome),
          ]
        );
      }
      for (const pr of seed.progress) {
        await client.query(
          `INSERT INTO aksh.ccare_plan_progress
            (id, scope_key, patient_id, patient_label, plan_ref_kind, plan_ref_id, title, owner_role,
             owner_display, status, progress_pct, milestones, created_at, updated_at, measurable_outcome, synthetic, ehr_write)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$14,$15::jsonb,TRUE,FALSE)
           ON CONFLICT (id) DO UPDATE SET scope_key = EXCLUDED.scope_key, patient_id = EXCLUDED.patient_id`,
          [
            pr.id,
            scopeKey,
            pr.patientId,
            pr.patientLabel,
            pr.planRefKind,
            pr.planRefId,
            pr.title,
            pr.ownerRole,
            pr.ownerDisplay,
            pr.status,
            pr.progressPct,
            JSON.stringify(pr.milestones),
            pr.createdAt,
            pr.updatedAt,
            JSON.stringify(pr.measurableOutcome),
          ]
        );
      }
      await client.query(
        `INSERT INTO aksh.ccare_decision_history
          (id, scope_key, patient_id, subject_kind, subject_id, action, actor, reason, created_at, synthetic, ehr_write)
         VALUES ($1,$2,$3,'follow_up',$4,'seed',$5,'Phase 4 continuous care synthetic seed',$6,TRUE,FALSE)`,
        [`cch-${randomUUID()}`, scopeKey, patientId, seed.followUps[0]?.id ?? patientId, actor, nowIso()]
      );
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  const store = await readStore(scopeKey);
  store.followUps = [...store.followUps.filter((x) => x.patientId !== patientId), ...seed.followUps];
  store.appointments = [
    ...store.appointments.filter((x) => x.patientId !== patientId),
    ...seed.appointments,
  ];
  store.updates = [...store.updates.filter((x) => x.patientId !== patientId), ...seed.updates];
  store.notificationPrefs = [
    ...store.notificationPrefs.filter((x) => x.patientId !== patientId),
    seed.notificationPrefs,
  ];
  store.escalations = [
    ...store.escalations.filter((x) => x.patientId !== patientId),
    ...seed.escalations,
  ];
  store.progress = [...store.progress.filter((x) => x.patientId !== patientId), ...seed.progress];
  store.completedActions = store.completedActions.filter((x) => x.patientId !== patientId);
  store.escalationDecisions = store.escalationDecisions.filter((d) =>
    seed.escalations.some((e) => e.id === d.escalationId)
  );
  store.history.unshift(
    hist(patientId, "follow_up", seed.followUps[0]?.id ?? patientId, "seed", actor, "Phase 4 continuous care synthetic seed")
  );
  await writeStore(store, scopeKey);
}

export async function listFollowUpItems(
  patientId: string,
  options?: { scopeKey?: string }
): Promise<FollowUpWorklistItem[]> {
  const scopeKey = options?.scopeKey ?? "shared";
  const store = await readStore(scopeKey);
  return store.followUps
    .filter((f) => f.patientId === patientId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listAllFollowUpItems(options?: {
  scopeKey?: string;
}): Promise<FollowUpWorklistItem[]> {
  const scopeKey = options?.scopeKey ?? "shared";
  const store = await readStore(scopeKey);
  return [...store.followUps].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listAppointments(
  patientId: string,
  options?: { scopeKey?: string }
): Promise<AppointmentCoordination[]> {
  const scopeKey = options?.scopeKey ?? "shared";
  const store = await readStore(scopeKey);
  return store.appointments
    .filter((a) => a.patientId === patientId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listPatientUpdates(
  patientId: string,
  options?: { scopeKey?: string }
): Promise<PatientReportedUpdate[]> {
  const scopeKey = options?.scopeKey ?? "shared";
  const store = await readStore(scopeKey);
  return store.updates
    .filter((u) => u.patientId === patientId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listAllPatientUpdates(options?: {
  scopeKey?: string;
}): Promise<PatientReportedUpdate[]> {
  const scopeKey = options?.scopeKey ?? "shared";
  const store = await readStore(scopeKey);
  return [...store.updates].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getNotificationPrefs(
  patientId: string,
  options?: { scopeKey?: string }
): Promise<NotificationPreferences | null> {
  const scopeKey = options?.scopeKey ?? "shared";
  const store = await readStore(scopeKey);
  return store.notificationPrefs.find((p) => p.patientId === patientId) ?? null;
}

export async function listEscalations(
  patientId: string,
  options?: { scopeKey?: string }
): Promise<StaffEscalationItem[]> {
  const scopeKey = options?.scopeKey ?? "shared";
  const store = await readStore(scopeKey);
  return store.escalations
    .filter((e) => e.patientId === patientId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listAllEscalations(options?: {
  scopeKey?: string;
}): Promise<StaffEscalationItem[]> {
  const scopeKey = options?.scopeKey ?? "shared";
  const store = await readStore(scopeKey);
  return [...store.escalations].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listCompletedActions(
  patientId: string,
  options?: { scopeKey?: string }
): Promise<CompletedCareAction[]> {
  const scopeKey = options?.scopeKey ?? "shared";
  const store = await readStore(scopeKey);
  return store.completedActions
    .filter((c) => c.patientId === patientId)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}

export async function listPlanProgress(
  patientId: string,
  options?: { scopeKey?: string }
): Promise<CarePlanProgress[]> {
  const scopeKey = options?.scopeKey ?? "shared";
  const store = await readStore(scopeKey);
  return store.progress
    .filter((p) => p.patientId === patientId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listDecisionHistory(
  patientId: string,
  options?: { scopeKey?: string }
): Promise<ContinuousCareHistoryEntry[]> {
  const scopeKey = options?.scopeKey ?? "shared";
  const store = await readStore(scopeKey);
  return store.history
    .filter((h) => h.patientId === patientId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function pushDecision(
  history: WorkflowDecisionEntry[],
  action: string,
  actor: string,
  reason: string | null,
  measurableOutcome?: MeasurableOutcome | null
): WorkflowDecisionEntry[] {
  return [
    {
      id: `d-${randomUUID()}`,
      action,
      actor,
      reason,
      at: nowIso(),
      measurableOutcome: measurableOutcome ?? null,
    },
    ...history,
  ];
}

/** Upsert a single follow-up worklist row (used by journey→continuous bridge). */
export async function upsertFollowUpWorklistItem(
  item: FollowUpWorklistItem,
  options?: { scopeKey?: string; organisationId?: string | null }
): Promise<FollowUpWorklistItem> {
  const scopeKey = options?.scopeKey ?? "shared";
  const organisationId = options?.organisationId?.trim() || null;

  if (usePg()) {
    const pool = getPgPool();
    await pool.query(
      `INSERT INTO aksh.ccare_follow_up_items
        (id, scope_key, organisation_id, patient_id, patient_label, title, source_kind, source_ref_id,
         owner_role, owner_display, status, priority, due_at, created_at, updated_at,
         closed_at, measurable_outcome, note, synthetic, ehr_write, autonomous_clinical_action)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb,$18,TRUE,FALSE,FALSE)
       ON CONFLICT (id) DO UPDATE SET
         scope_key = EXCLUDED.scope_key,
         organisation_id = COALESCE(EXCLUDED.organisation_id, aksh.ccare_follow_up_items.organisation_id),
         patient_id = EXCLUDED.patient_id,
         patient_label = EXCLUDED.patient_label,
         title = EXCLUDED.title,
         source_kind = EXCLUDED.source_kind,
         source_ref_id = EXCLUDED.source_ref_id,
         owner_role = EXCLUDED.owner_role,
         owner_display = EXCLUDED.owner_display,
         status = EXCLUDED.status,
         priority = EXCLUDED.priority,
         due_at = EXCLUDED.due_at,
         updated_at = EXCLUDED.updated_at,
         closed_at = EXCLUDED.closed_at,
         measurable_outcome = EXCLUDED.measurable_outcome,
         note = EXCLUDED.note`,
      [
        item.id,
        scopeKey,
        organisationId,
        item.patientId,
        item.patientLabel,
        item.title,
        item.sourceKind,
        item.sourceRefId,
        item.ownerRole,
        item.ownerDisplay,
        item.status,
        item.priority,
        item.dueAt,
        item.createdAt,
        item.updatedAt,
        item.closedAt,
        JSON.stringify(item.measurableOutcome),
        item.note,
      ]
    );
    return item;
  }

  const store = await readStore(scopeKey);
  const idx = store.followUps.findIndex((f) => f.id === item.id);
  if (idx >= 0) store.followUps[idx] = item;
  else store.followUps.push(item);
  await writeStore(store, scopeKey);
  return item;
}

export async function updateFollowUpItem(
  input: {
    patientId: string;
    itemId: string;
    status: FollowUpItemStatus;
    note?: string;
    actor: string;
  },
  options?: { scopeKey?: string }
): Promise<FollowUpWorklistItem> {
  const scopeKey = options?.scopeKey ?? "shared";
  const store = await readStore(scopeKey);
  const idx = store.followUps.findIndex((f) => f.id === input.itemId && f.patientId === input.patientId);
  if (idx < 0) {
    const err = new Error("Follow-up item not found") as Error & { status?: number };
    err.status = 404;
    throw err;
  }
  const prev = store.followUps[idx];
  const now = nowIso();
  const closed = input.status === "completed" || input.status === "cancelled";
  const outcome: MeasurableOutcome =
    input.status === "completed"
      ? { ...prev.measurableOutcome, value: true, achieved: true }
      : prev.measurableOutcome;
  const next: FollowUpWorklistItem = {
    ...prev,
    status: input.status,
    note: input.note ?? prev.note,
    updatedAt: now,
    closedAt: closed ? now : prev.closedAt,
    decisionHistory: pushDecision(prev.decisionHistory, `status_${input.status}`, input.actor, input.note ?? null, outcome),
    measurableOutcome: outcome,
  };
  store.followUps[idx] = next;
  store.history.unshift(
    hist(input.patientId, "follow_up", next.id, `status_${input.status}`, input.actor, input.note ?? null, outcome)
  );
  if (input.status === "completed") {
    store.completedActions.unshift({
      id: `ccact-${randomUUID()}`,
      patientId: input.patientId,
      patientLabel: next.patientLabel,
      actionKind: "follow_up_complete",
      title: next.title,
      ownerRole: next.ownerRole,
      ownerDisplay: next.ownerDisplay,
      status: "completed",
      sourceKind: next.sourceKind,
      sourceRefId: next.id,
      completedAt: now,
      createdAt: now,
      decisionHistory: [
        {
          id: `d-${randomUUID()}`,
          action: "complete",
          actor: input.actor,
          reason: input.note ?? null,
          at: now,
          measurableOutcome: outcome,
        },
      ],
      measurableOutcome: outcome,
      note: input.note ?? null,
      synthetic: true,
      ehrWrite: false,
    });
  }
  await writeStore(store, scopeKey);
  return next;
}

export async function updateAppointmentStatus(
  input: {
    patientId: string;
    appointmentId: string;
    status: AppointmentStatus;
    note?: string;
    actor: string;
  },
  options?: { scopeKey?: string }
): Promise<AppointmentCoordination> {
  const scopeKey = options?.scopeKey ?? "shared";
  const store = await readStore(scopeKey);
  const idx = store.appointments.findIndex(
    (a) => a.id === input.appointmentId && a.patientId === input.patientId
  );
  if (idx < 0) {
    const err = new Error("Appointment not found") as Error & { status?: number };
    err.status = 404;
    throw err;
  }
  const prev = store.appointments[idx];
  const now = nowIso();
  const closed = ["completed", "cancelled", "no_show"].includes(input.status);
  const outcome: MeasurableOutcome =
    input.status === "completed"
      ? { metric: "appointment_attended", value: true, achieved: true }
      : input.status === "confirmed"
        ? { metric: "appointment_confirmed", value: true, achieved: true }
        : prev.measurableOutcome;
  const next: AppointmentCoordination = {
    ...prev,
    status: input.status,
    note: input.note ?? prev.note,
    updatedAt: now,
    closedAt: closed ? now : prev.closedAt,
    decisionHistory: pushDecision(prev.decisionHistory, `status_${input.status}`, input.actor, input.note ?? null, outcome),
    measurableOutcome: outcome,
  };
  store.appointments[idx] = next;
  store.history.unshift(
    hist(input.patientId, "appointment", next.id, `status_${input.status}`, input.actor, input.note ?? null, outcome)
  );
  if (input.status === "completed") {
    store.completedActions.unshift({
      id: `ccact-${randomUUID()}`,
      patientId: input.patientId,
      patientLabel: next.patientLabel,
      actionKind: "appointment_complete",
      title: next.title,
      ownerRole: next.ownerRole,
      ownerDisplay: next.ownerDisplay,
      status: "completed",
      sourceKind: "appointment",
      sourceRefId: next.id,
      completedAt: now,
      createdAt: now,
      decisionHistory: [
        {
          id: `d-${randomUUID()}`,
          action: "complete",
          actor: input.actor,
          reason: input.note ?? null,
          at: now,
          measurableOutcome: outcome,
        },
      ],
      measurableOutcome: outcome,
      note: input.note ?? null,
      synthetic: true,
      ehrWrite: false,
    });
  }
  await writeStore(store, scopeKey);
  return next;
}

export async function triagePatientUpdate(
  input: {
    patientId: string;
    updateId: string;
    status: PatientUpdateStatus;
    note?: string;
    actor: string;
  },
  options?: { scopeKey?: string }
): Promise<PatientReportedUpdate> {
  const scopeKey = options?.scopeKey ?? "shared";
  const store = await readStore(scopeKey);
  const idx = store.updates.findIndex((u) => u.id === input.updateId && u.patientId === input.patientId);
  if (idx < 0) {
    const err = new Error("Patient update not found") as Error & { status?: number };
    err.status = 404;
    throw err;
  }
  const prev = store.updates[idx];
  const now = nowIso();
  const closed = input.status === "closed";
  const outcome: MeasurableOutcome =
    input.status === "acknowledged" || input.status === "closed"
      ? { metric: "clinician_ack", value: true, achieved: true }
      : prev.measurableOutcome;
  const next: PatientReportedUpdate = {
    ...prev,
    status: input.status,
    updatedAt: now,
    closedAt: closed ? now : prev.closedAt,
    decisionHistory: pushDecision(prev.decisionHistory, `status_${input.status}`, input.actor, input.note ?? null, outcome),
    measurableOutcome: outcome,
  };
  store.updates[idx] = next;
  store.history.unshift(
    hist(input.patientId, "patient_update", next.id, `status_${input.status}`, input.actor, input.note ?? null, outcome)
  );
  await writeStore(store, scopeKey);
  return next;
}

export async function updateNotificationPrefs(
  input: {
    patientId: string;
    channels?: NotificationPreferences["channels"];
    status?: NotificationPreferences["status"];
    topics?: string[];
    quietHours?: NotificationPreferences["quietHours"];
    actor: string;
  },
  options?: { scopeKey?: string }
): Promise<NotificationPreferences> {
  const scopeKey = options?.scopeKey ?? "shared";
  const store = await readStore(scopeKey);
  const idx = store.notificationPrefs.findIndex((p) => p.patientId === input.patientId);
  if (idx < 0) {
    const err = new Error("Notification preferences not found — seed continuous care first") as Error & {
      status?: number;
    };
    err.status = 404;
    throw err;
  }
  const prev = store.notificationPrefs[idx];
  const now = nowIso();
  const next: NotificationPreferences = {
    ...prev,
    channels: input.channels ?? prev.channels,
    status: input.status ?? prev.status,
    topics: input.topics ?? prev.topics,
    quietHours: input.quietHours === undefined ? prev.quietHours : input.quietHours,
    updatedAt: now,
    decisionHistory: pushDecision(prev.decisionHistory, "update_preferences", input.actor, null, {
      metric: "channels_configured",
      value: true,
      achieved: true,
    }),
    measurableOutcome: { metric: "channels_configured", value: true, achieved: true },
  };
  store.notificationPrefs[idx] = next;
  store.history.unshift(
    hist(input.patientId, "notification_pref", next.id, "update_preferences", input.actor, null, next.measurableOutcome)
  );
  await writeStore(store, scopeKey);
  return next;
}

export async function updatePlanProgress(
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
): Promise<CarePlanProgress> {
  const scopeKey = options?.scopeKey ?? "shared";
  const store = await readStore(scopeKey);
  const idx = store.progress.findIndex((p) => p.id === input.progressId && p.patientId === input.patientId);
  if (idx < 0) {
    const err = new Error("Care-plan progress not found") as Error & { status?: number };
    err.status = 404;
    throw err;
  }
  const prev = store.progress[idx];
  const now = nowIso();
  let milestones = prev.milestones;
  if (input.milestoneId != null && input.milestoneDone != null) {
    milestones = prev.milestones.map((m) =>
      m.id === input.milestoneId ? { ...m, done: input.milestoneDone! } : m
    );
  }
  const doneCount = milestones.filter((m) => m.done).length;
  const pct =
    input.progressPct ??
    (milestones.length ? Math.round((doneCount / milestones.length) * 100) : prev.progressPct);
  const outcome: MeasurableOutcome = {
    metric: "milestones_complete_pct",
    value: pct,
    unit: "%",
    achieved: pct >= 100,
  };
  const next: CarePlanProgress = {
    ...prev,
    status: input.status ?? (pct >= 100 ? "completed" : pct < 40 ? "at_risk" : "on_track"),
    progressPct: pct,
    milestones,
    updatedAt: now,
    decisionHistory: pushDecision(prev.decisionHistory, "update_progress", input.actor, null, outcome),
    measurableOutcome: outcome,
  };
  store.progress[idx] = next;
  store.history.unshift(
    hist(input.patientId, "plan_progress", next.id, "update_progress", input.actor, null, outcome, {
      progressPct: pct,
    })
  );
  await writeStore(store, scopeKey);
  return next;
}

export async function decideEscalation(
  input: {
    patientId: string;
    escalationId: string;
    action: ContinuousCareDecisionAction;
    actor: string;
    reason?: string;
    editedNote?: string;
  },
  options?: { scopeKey?: string }
): Promise<{ escalation: StaffEscalationItem; decision: EscalationDecision }> {
  const scopeKey = options?.scopeKey ?? "shared";
  const store = await readStore(scopeKey);
  const idx = store.escalations.findIndex(
    (e) => e.id === input.escalationId && e.patientId === input.patientId
  );
  if (idx < 0) {
    const err = new Error("Escalation not found") as Error & { status?: number };
    err.status = 404;
    throw err;
  }
  const prev = store.escalations[idx];
  if (input.action === "reject" && !input.reason?.trim()) {
    const err = new Error("reason required for reject") as Error & { status?: number };
    err.status = 400;
    throw err;
  }
  const now = nowIso();
  const statusMap: Record<ContinuousCareDecisionAction, StaffEscalationItem["status"]> = {
    accept: "accepted",
    edit: "edited",
    reject: "rejected",
    resolve: "resolved",
    queue: "queued",
  };
  const nextStatus = statusMap[input.action];
  const closed = ["rejected", "resolved", "cancelled"].includes(nextStatus);
  const outcome: MeasurableOutcome =
    input.action === "resolve" || input.action === "accept"
      ? { metric: "escalation_resolved_safely", value: true, achieved: true }
      : input.action === "reject"
        ? { metric: "escalation_resolved_safely", value: false, achieved: true }
        : prev.measurableOutcome;

  const decision: EscalationDecision = {
    id: `cced-${randomUUID()}`,
    escalationId: prev.id,
    action: input.action,
    actor: input.actor,
    reason: input.reason ?? null,
    editedNote: input.editedNote ?? null,
    createdAt: now,
  };

  const next: StaffEscalationItem = {
    ...prev,
    status: nextStatus,
    reason: input.editedNote ? `${prev.reason}\n[edit] ${input.editedNote}` : prev.reason,
    updatedAt: now,
    decidedBy: input.actor,
    decidedAt: now,
    closedAt: closed ? now : prev.closedAt,
    decisionHistory: pushDecision(prev.decisionHistory, input.action, input.actor, input.reason ?? null, outcome),
    measurableOutcome: outcome,
  };

  store.escalations[idx] = next;
  store.escalationDecisions.unshift(decision);
  store.history.unshift(
    hist(input.patientId, "escalation", next.id, input.action, input.actor, input.reason ?? null, outcome)
  );

  if (input.action === "resolve" || input.action === "accept") {
    store.completedActions.unshift({
      id: `ccact-${randomUUID()}`,
      patientId: input.patientId,
      patientLabel: next.patientLabel,
      actionKind: `escalation_${input.action}`,
      title: next.title,
      ownerRole: next.ownerRole,
      ownerDisplay: next.ownerDisplay,
      status: "completed",
      sourceKind: "escalation",
      sourceRefId: next.id,
      completedAt: now,
      createdAt: now,
      decisionHistory: [
        {
          id: `d-${randomUUID()}`,
          action: input.action,
          actor: input.actor,
          reason: input.reason ?? null,
          at: now,
          measurableOutcome: outcome,
        },
      ],
      measurableOutcome: outcome,
      note: input.reason ?? null,
      synthetic: true,
      ehrWrite: false,
    });
  }

  await writeStore(store, scopeKey);
  return { escalation: next, decision };
}
