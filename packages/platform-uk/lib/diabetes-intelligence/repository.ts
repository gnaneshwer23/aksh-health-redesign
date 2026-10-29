import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import { getPgPool, isPostgresConfigured } from "../db/client";
import type {
  CareFollowUpStatus,
  CareFollowUpTask,
  CarePlanDecision,
  CarePlanDecisionAction,
  CarePlanRecord,
  CarePlanSection,
  CarePlanStatus,
  JourneyTimelineEvent,
  MissingDataIndicator,
} from "./types";

type Store = {
  plans: CarePlanRecord[];
  decisions: CarePlanDecision[];
  followUps: CareFollowUpTask[];
  events: JourneyTimelineEvent[];
};

const dataDir = path.join(process.cwd(), "data");

function resolveFile(scopeKey = "shared") {
  const safe = /^[a-zA-Z0-9_-]{3,64}$/.test(scopeKey) ? scopeKey : "shared";
  return path.join(
    dataDir,
    safe === "shared" ? "diabetes-care-journey.json" : `diabetes-care-journey.${safe}.json`
  );
}

async function readStore(scopeKey: string): Promise<Store> {
  const file = resolveFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  try {
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw) as Partial<Store>;
    return {
      plans: Array.isArray(parsed.plans) ? parsed.plans : [],
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
      followUps: Array.isArray(parsed.followUps) ? parsed.followUps : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch {
    return { plans: [], decisions: [], followUps: [], events: [] };
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

export async function appendJourneyEvent(
  event: Omit<JourneyTimelineEvent, "ehrWrite"> & { ehrWrite?: false },
  options?: { scopeKey?: string }
): Promise<JourneyTimelineEvent> {
  const scopeKey = options?.scopeKey ?? "shared";
  const row: JourneyTimelineEvent = { ...event, ehrWrite: false };

  if (usePg()) {
    const pool = getPgPool();
    await pool.query(
      `INSERT INTO aksh.care_journey_events
        (id, scope_key, patient_id, kind, title, summary, occurred_at, metadata, ehr_write)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,false)
       ON CONFLICT (id) DO NOTHING`,
      [
        row.id,
        scopeKey,
        row.patientId,
        row.kind,
        row.title,
        row.summary,
        row.occurredAt,
        JSON.stringify(row.metadata ?? {}),
      ]
    );
    return row;
  }

  const store = await readStore(scopeKey);
  store.events.push(row);
  await writeStore(store, scopeKey);
  return row;
}

export async function listJourneyEvents(
  patientId: string,
  options?: { scopeKey?: string }
): Promise<JourneyTimelineEvent[]> {
  const scopeKey = options?.scopeKey ?? "shared";
  if (usePg()) {
    const pool = getPgPool();
    const { rows } = await pool.query<{
      id: string;
      patient_id: string;
      kind: JourneyTimelineEvent["kind"];
      title: string;
      summary: string;
      occurred_at: Date;
      metadata: Record<string, unknown>;
    }>(
      `SELECT id, patient_id, kind, title, summary, occurred_at, metadata
       FROM aksh.care_journey_events
       WHERE scope_key = $1 AND patient_id = $2
       ORDER BY occurred_at ASC`,
      [scopeKey, patientId]
    );
    return rows.map((r) => ({
      id: r.id,
      patientId: r.patient_id,
      kind: r.kind,
      title: r.title,
      summary: r.summary,
      occurredAt: new Date(r.occurred_at).toISOString(),
      ehrWrite: false as const,
      metadata: r.metadata ?? undefined,
    }));
  }
  const store = await readStore(scopeKey);
  return store.events
    .filter((e) => e.patientId === patientId)
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
}

export async function createCarePlanRecord(
  input: {
    patientId: string;
    patientLabel: string;
    sections: CarePlanSection[];
    safetyNotes: string[];
    missingData: MissingDataIndicator[];
    createdBy: string;
  },
  options?: { scopeKey?: string }
): Promise<CarePlanRecord> {
  const scopeKey = options?.scopeKey ?? "shared";
  const now = new Date().toISOString();
  const plan: CarePlanRecord = {
    id: `cp-${randomUUID()}`,
    patientId: input.patientId,
    patientLabel: input.patientLabel,
    status: "DRAFT",
    sections: input.sections,
    safetyNotes: input.safetyNotes,
    missingData: input.missingData,
    createdBy: input.createdBy,
    createdAt: now,
    decidedBy: null,
    decidedAt: null,
    decisionReason: null,
    version: 1,
    hitlRequired: true,
    ehrWrite: false,
    synthetic: true,
  };

  if (usePg()) {
    const pool = getPgPool();
    await pool.query(
      `INSERT INTO aksh.care_plan_records
        (id, scope_key, patient_id, patient_label, status, sections, safety_notes, missing_data,
         created_by, created_at, version, hitl_required, ehr_write, synthetic)
       VALUES ($1,$2,$3,$4,'DRAFT',$5::jsonb,$6,$7::jsonb,$8,$9,1,true,false,true)`,
      [
        plan.id,
        scopeKey,
        plan.patientId,
        plan.patientLabel,
        JSON.stringify(plan.sections),
        plan.safetyNotes,
        JSON.stringify(plan.missingData),
        plan.createdBy,
        plan.createdAt,
      ]
    );
  } else {
    const store = await readStore(scopeKey);
    store.plans.push(plan);
    await writeStore(store, scopeKey);
  }

  await appendJourneyEvent(
    {
      id: `evt-${randomUUID()}`,
      patientId: plan.patientId,
      kind: "care_plan_draft",
      title: "Care plan drafted",
      summary: `DRAFT plan ${plan.id} — HITL required; ehrWrite=false`,
      occurredAt: now,
      metadata: { planId: plan.id, status: plan.status },
    },
    { scopeKey }
  );

  return plan;
}

export async function listCarePlans(
  patientId: string,
  options?: { scopeKey?: string }
): Promise<CarePlanRecord[]> {
  const scopeKey = options?.scopeKey ?? "shared";
  if (usePg()) {
    const pool = getPgPool();
    const { rows } = await pool.query<{
      id: string;
      patient_id: string;
      patient_label: string;
      status: CarePlanStatus;
      sections: CarePlanSection[];
      safety_notes: string[];
      missing_data: MissingDataIndicator[];
      created_by: string;
      created_at: Date;
      decided_by: string | null;
      decided_at: Date | null;
      decision_reason: string | null;
      version: number;
    }>(
      `SELECT * FROM aksh.care_plan_records
       WHERE scope_key = $1 AND patient_id = $2
       ORDER BY created_at DESC`,
      [scopeKey, patientId]
    );
    return rows.map((r) => ({
      id: r.id,
      patientId: r.patient_id,
      patientLabel: r.patient_label,
      status: r.status,
      sections: r.sections,
      safetyNotes: r.safety_notes ?? [],
      missingData: r.missing_data ?? [],
      createdBy: r.created_by,
      createdAt: new Date(r.created_at).toISOString(),
      decidedBy: r.decided_by,
      decidedAt: r.decided_at ? new Date(r.decided_at).toISOString() : null,
      decisionReason: r.decision_reason,
      version: r.version,
      hitlRequired: true as const,
      ehrWrite: false as const,
      synthetic: true as const,
    }));
  }
  const store = await readStore(scopeKey);
  return store.plans
    .filter((p) => p.patientId === patientId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getCarePlan(
  planId: string,
  options?: { scopeKey?: string }
): Promise<CarePlanRecord | null> {
  const scopeKey = options?.scopeKey ?? "shared";
  const plans = await listCarePlansByScope(scopeKey);
  return plans.find((p) => p.id === planId) ?? null;
}

async function listCarePlansByScope(scopeKey: string): Promise<CarePlanRecord[]> {
  if (usePg()) {
    const pool = getPgPool();
    const { rows } = await pool.query(`SELECT patient_id FROM aksh.care_plan_records WHERE scope_key = $1`, [
      scopeKey,
    ]);
    const ids = [...new Set(rows.map((r: { patient_id: string }) => r.patient_id))];
    const all: CarePlanRecord[] = [];
    for (const id of ids) all.push(...(await listCarePlans(id, { scopeKey })));
    return all;
  }
  return (await readStore(scopeKey)).plans;
}

export async function decideCarePlan(
  input: {
    planId: string;
    action: CarePlanDecisionAction;
    actor: string;
    reason?: string;
    editedSections?: CarePlanSection[];
  },
  options?: { scopeKey?: string }
): Promise<{ plan: CarePlanRecord; decision: CarePlanDecision; followUp: CareFollowUpTask | null }> {
  const scopeKey = options?.scopeKey ?? "shared";
  const plan = await getCarePlan(input.planId, { scopeKey });
  if (!plan) throw new Error("Care plan not found");
  if (plan.status !== "DRAFT") throw new Error(`Plan is ${plan.status}; only DRAFT can be decided`);

  if (input.action === "reject" && !input.reason?.trim()) {
    throw new Error("Reject requires a reason");
  }
  if (input.action === "edit" && (!input.editedSections || input.editedSections.length === 0)) {
    throw new Error("Edit requires editedSections");
  }

  const now = new Date().toISOString();
  const decision: CarePlanDecision = {
    id: `cpd-${randomUUID()}`,
    planId: plan.id,
    action: input.action,
    actor: input.actor,
    reason: input.reason?.trim() ?? null,
    editedSections: input.action === "edit" ? input.editedSections ?? null : null,
    createdAt: now,
  };

  let nextStatus: CarePlanStatus =
    input.action === "accept" ? "APPROVED" : input.action === "reject" ? "REJECTED" : "APPROVED";
  const nextSections = input.action === "edit" ? input.editedSections! : plan.sections;

  const updated: CarePlanRecord = {
    ...plan,
    status: nextStatus,
    sections: nextSections,
    decidedBy: input.actor,
    decidedAt: now,
    decisionReason: decision.reason,
    version: plan.version + 1,
  };

  let followUp: CareFollowUpTask | null = null;

  if (usePg()) {
    const pool = getPgPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE aksh.care_plan_records
         SET status = $1, sections = $2::jsonb, decided_by = $3, decided_at = $4,
             decision_reason = $5, version = $6
         WHERE id = $7 AND scope_key = $8 AND status = 'DRAFT'`,
        [
          updated.status,
          JSON.stringify(updated.sections),
          updated.decidedBy,
          updated.decidedAt,
          updated.decisionReason,
          updated.version,
          plan.id,
          scopeKey,
        ]
      );
      await client.query(
        `INSERT INTO aksh.care_plan_decisions (id, plan_id, action, actor, reason, edited_sections, created_at)
         VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7)`,
        [
          decision.id,
          decision.planId,
          decision.action,
          decision.actor,
          decision.reason,
          decision.editedSections ? JSON.stringify(decision.editedSections) : null,
          decision.createdAt,
        ]
      );
      if (input.action === "accept" || input.action === "edit") {
        followUp = buildFollowUp(plan.patientId, plan.id, input.actor, now);
        await client.query(
          `INSERT INTO aksh.care_follow_up_tasks
            (id, scope_key, patient_id, plan_id, title, owner, status, due_at, created_at, synthetic)
           VALUES ($1,$2,$3,$4,$5,$6,'open',$7,$8,true)`,
          [
            followUp.id,
            scopeKey,
            followUp.patientId,
            followUp.planId,
            followUp.title,
            followUp.owner,
            followUp.dueAt,
            followUp.createdAt,
          ]
        );
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } else {
    const store = await readStore(scopeKey);
    const idx = store.plans.findIndex((p) => p.id === plan.id);
    if (idx < 0) throw new Error("Care plan not found");
    store.plans[idx] = updated;
    store.decisions.push(decision);
    if (input.action === "accept" || input.action === "edit") {
      followUp = buildFollowUp(plan.patientId, plan.id, input.actor, now);
      store.followUps.push(followUp);
    }
    await writeStore(store, scopeKey);
  }

  await appendJourneyEvent(
    {
      id: `evt-${randomUUID()}`,
      patientId: plan.patientId,
      kind: "care_plan_decision",
      title: `Care plan ${input.action}`,
      summary: `${input.action} by ${input.actor} → ${nextStatus}`,
      occurredAt: now,
      metadata: { planId: plan.id, action: input.action, status: nextStatus },
    },
    { scopeKey }
  );

  if (followUp) {
    await appendJourneyEvent(
      {
        id: `evt-${randomUUID()}`,
        patientId: plan.patientId,
        kind: "follow_up",
        title: "Follow-up created",
        summary: `${followUp.title} · owner=${followUp.owner} · due ${followUp.dueAt}`,
        occurredAt: now,
        metadata: { taskId: followUp.id, planId: plan.id },
      },
      { scopeKey }
    );
  }

  return { plan: updated, decision, followUp };
}

function buildFollowUp(
  patientId: string,
  planId: string,
  owner: string,
  now: string
): CareFollowUpTask {
  const due = new Date(now);
  due.setDate(due.getDate() + 14);
  return {
    id: `cfu-${randomUUID()}`,
    patientId,
    planId,
    title: "Diabetes care-plan follow-up (clinician-confirmed)",
    owner,
    status: "open",
    dueAt: due.toISOString(),
    createdAt: now,
    acknowledgedAt: null,
    closedAt: null,
    note: null,
    synthetic: true,
  };
}

export async function listFollowUps(
  patientId: string,
  options?: { scopeKey?: string }
): Promise<CareFollowUpTask[]> {
  const scopeKey = options?.scopeKey ?? "shared";
  if (usePg()) {
    const pool = getPgPool();
    const { rows } = await pool.query<{
      id: string;
      patient_id: string;
      plan_id: string | null;
      title: string;
      owner: string;
      status: CareFollowUpStatus;
      due_at: Date;
      created_at: Date;
      acknowledged_at: Date | null;
      closed_at: Date | null;
      note: string | null;
    }>(
      `SELECT * FROM aksh.care_follow_up_tasks
       WHERE scope_key = $1 AND patient_id = $2
       ORDER BY created_at DESC`,
      [scopeKey, patientId]
    );
    return rows.map((r) => ({
      id: r.id,
      patientId: r.patient_id,
      planId: r.plan_id,
      title: r.title,
      owner: r.owner,
      status: r.status,
      dueAt: new Date(r.due_at).toISOString(),
      createdAt: new Date(r.created_at).toISOString(),
      acknowledgedAt: r.acknowledged_at ? new Date(r.acknowledged_at).toISOString() : null,
      closedAt: r.closed_at ? new Date(r.closed_at).toISOString() : null,
      note: r.note,
      synthetic: true as const,
    }));
  }
  const store = await readStore(scopeKey);
  return store.followUps
    .filter((t) => t.patientId === patientId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateFollowUp(
  input: {
    taskId: string;
    action: "acknowledge" | "complete" | "cancel";
    note?: string;
  },
  options?: { scopeKey?: string }
): Promise<CareFollowUpTask> {
  const scopeKey = options?.scopeKey ?? "shared";
  const now = new Date().toISOString();

  if (usePg()) {
    const pool = getPgPool();
    const status =
      input.action === "acknowledge"
        ? "acknowledged"
        : input.action === "complete"
          ? "completed"
          : "cancelled";
    const { rows } = await pool.query(
      `UPDATE aksh.care_follow_up_tasks
       SET status = $1,
           acknowledged_at = CASE WHEN $1 = 'acknowledged' OR acknowledged_at IS NOT NULL THEN COALESCE(acknowledged_at, $2::timestamptz) ELSE acknowledged_at END,
           closed_at = CASE WHEN $1 IN ('completed','cancelled') THEN $2::timestamptz ELSE closed_at END,
           note = COALESCE($3, note)
       WHERE id = $4 AND scope_key = $5
       RETURNING *`,
      [status, now, input.note ?? null, input.taskId, scopeKey]
    );
    if (!rows[0]) throw new Error("Follow-up not found");
    const r = rows[0];
    const task: CareFollowUpTask = {
      id: r.id,
      patientId: r.patient_id,
      planId: r.plan_id,
      title: r.title,
      owner: r.owner,
      status: r.status,
      dueAt: new Date(r.due_at).toISOString(),
      createdAt: new Date(r.created_at).toISOString(),
      acknowledgedAt: r.acknowledged_at ? new Date(r.acknowledged_at).toISOString() : null,
      closedAt: r.closed_at ? new Date(r.closed_at).toISOString() : null,
      note: r.note,
      synthetic: true,
    };
    await appendJourneyEvent(
      {
        id: `evt-${randomUUID()}`,
        patientId: task.patientId,
        kind: "follow_up",
        title: `Follow-up ${input.action}`,
        summary: `${task.title} → ${task.status}`,
        occurredAt: now,
        metadata: { taskId: task.id, action: input.action },
      },
      { scopeKey }
    );
    return task;
  }

  const store = await readStore(scopeKey);
  const idx = store.followUps.findIndex((t) => t.id === input.taskId);
  if (idx < 0) throw new Error("Follow-up not found");
  const prev = store.followUps[idx];
  const next: CareFollowUpTask = {
    ...prev,
    status:
      input.action === "acknowledge"
        ? "acknowledged"
        : input.action === "complete"
          ? "completed"
          : "cancelled",
    acknowledgedAt:
      input.action === "acknowledge" || prev.acknowledgedAt ? prev.acknowledgedAt ?? now : prev.acknowledgedAt,
    closedAt: input.action === "complete" || input.action === "cancel" ? now : prev.closedAt,
    note: input.note ?? prev.note,
  };
  store.followUps[idx] = next;
  await writeStore(store, scopeKey);
  await appendJourneyEvent(
    {
      id: `evt-${randomUUID()}`,
      patientId: next.patientId,
      kind: "follow_up",
      title: `Follow-up ${input.action}`,
      summary: `${next.title} → ${next.status}`,
      occurredAt: now,
      metadata: { taskId: next.id, action: input.action },
    },
    { scopeKey }
  );
  return next;
}
