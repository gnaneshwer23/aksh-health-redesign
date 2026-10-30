/**
 * Phase 3 medication + personalised care persistence (file store + optional local-dev PG).
 */

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import { getPgPool, isPostgresConfigured } from "../db/client";
import type {
  AssignedCareTask,
  CareTeamHandoff,
  MedCareApprovalHistoryEntry,
  MedCareDecisionAction,
  MedCareReviewDecision,
  MedCareReviewSection,
  MedicationSafetyFlag,
  MedicationSafetyFlagStatus,
  MedicationSafetyReview,
  PatientGoal,
  PatientGoalStatus,
  PersonalisedCarePlan,
  PersonalisedCarePlanSection,
  CarePlanTemplateId,
  MedCareReviewStatus,
  CareTaskStatus,
} from "./medcare-types";

type Store = {
  safetyFlags: MedicationSafetyFlag[];
  safetyReviews: MedicationSafetyReview[];
  reviewDecisions: MedCareReviewDecision[];
  carePlans: PersonalisedCarePlan[];
  goals: PatientGoal[];
  tasks: AssignedCareTask[];
  handoffs: CareTeamHandoff[];
  history: MedCareApprovalHistoryEntry[];
};

const dataDir = path.join(process.cwd(), "data");

function resolveFile(scopeKey = "shared") {
  const safe = /^[a-zA-Z0-9_-]{3,64}$/.test(scopeKey) ? scopeKey : "shared";
  return path.join(
    dataDir,
    safe === "shared"
      ? "medication-personalised-care.json"
      : `medication-personalised-care.${safe}.json`
  );
}

async function readStore(scopeKey: string): Promise<Store> {
  const file = resolveFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  try {
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw) as Partial<Store>;
    return {
      safetyFlags: Array.isArray(parsed.safetyFlags) ? parsed.safetyFlags : [],
      safetyReviews: Array.isArray(parsed.safetyReviews) ? parsed.safetyReviews : [],
      reviewDecisions: Array.isArray(parsed.reviewDecisions) ? parsed.reviewDecisions : [],
      carePlans: Array.isArray(parsed.carePlans) ? parsed.carePlans : [],
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      handoffs: Array.isArray(parsed.handoffs) ? parsed.handoffs : [],
      history: Array.isArray(parsed.history) ? parsed.history : [],
    };
  } catch {
    return {
      safetyFlags: [],
      safetyReviews: [],
      reviewDecisions: [],
      carePlans: [],
      goals: [],
      tasks: [],
      handoffs: [],
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

export async function replacePatientMedCareSeed(
  patientId: string,
  seed: {
    safetyFlags: MedicationSafetyFlag[];
    goals: PatientGoal[];
    tasks?: AssignedCareTask[];
    handoffs?: CareTeamHandoff[];
  },
  options?: { scopeKey?: string; actor?: string }
): Promise<void> {
  const scopeKey = options?.scopeKey ?? "shared";
  const actor = options?.actor ?? "synthetic-seed";

  if (usePg()) {
    const pool = getPgPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `DELETE FROM aksh.medcare_safety_flags WHERE scope_key=$1 AND patient_id=$2`,
        [scopeKey, patientId]
      );
      await client.query(
        `DELETE FROM aksh.medcare_patient_goals WHERE scope_key=$1 AND patient_id=$2`,
        [scopeKey, patientId]
      );
      await client.query(
        `DELETE FROM aksh.medcare_assigned_tasks WHERE scope_key=$1 AND patient_id=$2`,
        [scopeKey, patientId]
      );
      await client.query(
        `DELETE FROM aksh.medcare_handoffs WHERE scope_key=$1 AND patient_id=$2`,
        [scopeKey, patientId]
      );
      const seenFlagIds = new Set<string>();
      for (const f of seed.safetyFlags) {
        if (seenFlagIds.has(f.id)) continue;
        seenFlagIds.add(f.id);
        await client.query(
          `INSERT INTO aksh.medcare_safety_flags
            (id, scope_key, patient_id, code, severity, title, detail, related_medications,
             status, created_at, decided_by, decided_at, decision_note, synthetic)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,$13,TRUE)
           ON CONFLICT (id) DO UPDATE SET
             scope_key = EXCLUDED.scope_key,
             patient_id = EXCLUDED.patient_id,
             code = EXCLUDED.code,
             severity = EXCLUDED.severity,
             title = EXCLUDED.title,
             detail = EXCLUDED.detail,
             related_medications = EXCLUDED.related_medications,
             status = EXCLUDED.status,
             created_at = EXCLUDED.created_at,
             decided_by = EXCLUDED.decided_by,
             decided_at = EXCLUDED.decided_at,
             decision_note = EXCLUDED.decision_note,
             synthetic = TRUE`,
          [
            f.id,
            scopeKey,
            patientId,
            f.code,
            f.severity,
            f.title,
            f.detail,
            JSON.stringify(f.relatedMedications),
            f.status,
            f.createdAt,
            f.decidedBy,
            f.decidedAt,
            f.decisionNote,
          ]
        );
      }
      for (const g of seed.goals) {
        await client.query(
          `INSERT INTO aksh.medcare_patient_goals
            (id, scope_key, patient_id, title, description, category, status, target_date, created_at, updated_at, synthetic)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE)
           ON CONFLICT (id) DO UPDATE SET
             scope_key = EXCLUDED.scope_key,
             patient_id = EXCLUDED.patient_id,
             title = EXCLUDED.title,
             description = EXCLUDED.description,
             category = EXCLUDED.category,
             status = EXCLUDED.status,
             target_date = EXCLUDED.target_date,
             created_at = EXCLUDED.created_at,
             updated_at = EXCLUDED.updated_at,
             synthetic = TRUE`,
          [
            g.id,
            scopeKey,
            patientId,
            g.title,
            g.description,
            g.category,
            g.status,
            g.targetDate,
            g.createdAt,
            g.updatedAt,
          ]
        );
      }
      for (const t of seed.tasks ?? []) {
        await client.query(
          `INSERT INTO aksh.medcare_assigned_tasks
            (id, scope_key, patient_id, title, description, owner_role, owner_display, status,
             due_at, related_plan_id, related_flag_id, created_at, updated_at, closed_at, note, synthetic)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,TRUE)
           ON CONFLICT (id) DO UPDATE SET
             scope_key = EXCLUDED.scope_key,
             patient_id = EXCLUDED.patient_id,
             title = EXCLUDED.title,
             description = EXCLUDED.description,
             owner_role = EXCLUDED.owner_role,
             owner_display = EXCLUDED.owner_display,
             status = EXCLUDED.status,
             due_at = EXCLUDED.due_at,
             related_plan_id = EXCLUDED.related_plan_id,
             related_flag_id = EXCLUDED.related_flag_id,
             created_at = EXCLUDED.created_at,
             updated_at = EXCLUDED.updated_at,
             closed_at = EXCLUDED.closed_at,
             note = EXCLUDED.note,
             synthetic = TRUE`,
          [
            t.id,
            scopeKey,
            patientId,
            t.title,
            t.description,
            t.ownerRole,
            t.ownerDisplay,
            t.status,
            t.dueAt,
            t.relatedPlanId,
            t.relatedFlagId,
            t.createdAt,
            t.updatedAt,
            t.closedAt,
            t.note,
          ]
        );
      }
      for (const h of seed.handoffs ?? []) {
        await client.query(
          `INSERT INTO aksh.medcare_handoffs
            (id, scope_key, patient_id, from_role, to_role, to_member_display, summary,
             related_task_id, created_at, acknowledged_at, synthetic)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE)
           ON CONFLICT (id) DO UPDATE SET
             scope_key = EXCLUDED.scope_key,
             patient_id = EXCLUDED.patient_id,
             from_role = EXCLUDED.from_role,
             to_role = EXCLUDED.to_role,
             to_member_display = EXCLUDED.to_member_display,
             summary = EXCLUDED.summary,
             related_task_id = EXCLUDED.related_task_id,
             created_at = EXCLUDED.created_at,
             acknowledged_at = EXCLUDED.acknowledged_at,
             synthetic = TRUE`,
          [
            h.id,
            scopeKey,
            patientId,
            h.fromRole,
            h.toRole,
            h.toMemberDisplay,
            h.summary,
            h.relatedTaskId,
            h.createdAt,
            h.acknowledgedAt,
          ]
        );
      }
      await client.query(
        `INSERT INTO aksh.medcare_approval_history
          (id, scope_key, patient_id, subject_kind, subject_id, action, actor, reason, created_at, synthetic, metadata)
         VALUES ($1,$2,$3,'medication_safety_flag',$4,'create',$5,$6,$7,TRUE,$8::jsonb)`,
        [
          `hist-${randomUUID()}`,
          scopeKey,
          patientId,
          seed.safetyFlags[0]?.id ?? "seed",
          actor,
          "Seeded synthetic medication + personalised care spine",
          nowIso(),
          JSON.stringify({ flags: seed.safetyFlags.length, goals: seed.goals.length }),
        ]
      );
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
    return;
  }

  const store = await readStore(scopeKey);
  store.safetyFlags = [
    ...store.safetyFlags.filter((f) => f.patientId !== patientId),
    ...seed.safetyFlags,
  ];
  store.goals = [...store.goals.filter((g) => g.patientId !== patientId), ...seed.goals];
  if (seed.tasks) {
    store.tasks = [...store.tasks.filter((t) => t.patientId !== patientId), ...seed.tasks];
  }
  if (seed.handoffs) {
    store.handoffs = [
      ...store.handoffs.filter((h) => h.patientId !== patientId),
      ...seed.handoffs,
    ];
  }
  store.history.push({
    id: `hist-${randomUUID()}`,
    patientId,
    subjectKind: "medication_safety_flag",
    subjectId: seed.safetyFlags[0]?.id ?? "seed",
    action: "create",
    actor,
    reason: "Seeded synthetic medication + personalised care spine",
    createdAt: nowIso(),
    ehrWrite: false,
    synthetic: true,
    metadata: { flags: seed.safetyFlags.length, goals: seed.goals.length },
  });
  await writeStore(store, scopeKey);
}

export async function listSafetyFlags(
  patientId: string,
  options?: { scopeKey?: string }
): Promise<MedicationSafetyFlag[]> {
  const scopeKey = options?.scopeKey ?? "shared";
  if (usePg()) {
    const pool = getPgPool();
    const { rows } = await pool.query(
      `SELECT * FROM aksh.medcare_safety_flags WHERE scope_key=$1 AND patient_id=$2 ORDER BY created_at DESC`,
      [scopeKey, patientId]
    );
    return rows.map(mapFlagRow);
  }
  const store = await readStore(scopeKey);
  return store.safetyFlags
    .filter((f) => f.patientId === patientId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listGoals(
  patientId: string,
  options?: { scopeKey?: string }
): Promise<PatientGoal[]> {
  const scopeKey = options?.scopeKey ?? "shared";
  if (usePg()) {
    const pool = getPgPool();
    const { rows } = await pool.query(
      `SELECT * FROM aksh.medcare_patient_goals WHERE scope_key=$1 AND patient_id=$2 ORDER BY created_at`,
      [scopeKey, patientId]
    );
    return rows.map(mapGoalRow);
  }
  const store = await readStore(scopeKey);
  return store.goals.filter((g) => g.patientId === patientId);
}

export async function listCarePlans(
  patientId: string,
  options?: { scopeKey?: string }
): Promise<PersonalisedCarePlan[]> {
  const scopeKey = options?.scopeKey ?? "shared";
  if (usePg()) {
    const pool = getPgPool();
    const { rows } = await pool.query(
      `SELECT * FROM aksh.medcare_care_plans WHERE scope_key=$1 AND patient_id=$2 ORDER BY created_at DESC`,
      [scopeKey, patientId]
    );
    return rows.map(mapPlanRow);
  }
  const store = await readStore(scopeKey);
  return store.carePlans
    .filter((p) => p.patientId === patientId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listTasks(
  patientId: string,
  options?: { scopeKey?: string }
): Promise<AssignedCareTask[]> {
  const scopeKey = options?.scopeKey ?? "shared";
  if (usePg()) {
    const pool = getPgPool();
    const { rows } = await pool.query(
      `SELECT * FROM aksh.medcare_assigned_tasks WHERE scope_key=$1 AND patient_id=$2 ORDER BY created_at DESC`,
      [scopeKey, patientId]
    );
    return rows.map(mapTaskRow);
  }
  const store = await readStore(scopeKey);
  return store.tasks
    .filter((t) => t.patientId === patientId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listHandoffs(
  patientId: string,
  options?: { scopeKey?: string }
): Promise<CareTeamHandoff[]> {
  const scopeKey = options?.scopeKey ?? "shared";
  if (usePg()) {
    const pool = getPgPool();
    const { rows } = await pool.query(
      `SELECT * FROM aksh.medcare_handoffs WHERE scope_key=$1 AND patient_id=$2 ORDER BY created_at DESC`,
      [scopeKey, patientId]
    );
    return rows.map(mapHandoffRow);
  }
  const store = await readStore(scopeKey);
  return store.handoffs
    .filter((h) => h.patientId === patientId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listApprovalHistory(
  patientId: string,
  options?: { scopeKey?: string }
): Promise<MedCareApprovalHistoryEntry[]> {
  const scopeKey = options?.scopeKey ?? "shared";
  if (usePg()) {
    const pool = getPgPool();
    const { rows } = await pool.query(
      `SELECT * FROM aksh.medcare_approval_history WHERE scope_key=$1 AND patient_id=$2 ORDER BY created_at DESC`,
      [scopeKey, patientId]
    );
    return rows.map(mapHistoryRow);
  }
  const store = await readStore(scopeKey);
  return store.history
    .filter((h) => h.patientId === patientId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listSafetyReviews(
  patientId: string,
  options?: { scopeKey?: string }
): Promise<MedicationSafetyReview[]> {
  const scopeKey = options?.scopeKey ?? "shared";
  if (usePg()) {
    const pool = getPgPool();
    const { rows } = await pool.query(
      `SELECT * FROM aksh.medcare_safety_reviews WHERE scope_key=$1 AND patient_id=$2 ORDER BY created_at DESC`,
      [scopeKey, patientId]
    );
    return rows.map(mapReviewRow);
  }
  const store = await readStore(scopeKey);
  return store.safetyReviews
    .filter((r) => r.patientId === patientId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createSafetyReview(
  input: {
    patientId: string;
    patientLabel: string;
    summarySections: MedCareReviewSection[];
    flagIds: string[];
    createdBy: string;
  },
  options?: { scopeKey?: string }
): Promise<MedicationSafetyReview> {
  const scopeKey = options?.scopeKey ?? "shared";
  const review: MedicationSafetyReview = {
    id: `msr-${randomUUID()}`,
    patientId: input.patientId,
    patientLabel: input.patientLabel,
    status: "DRAFT",
    summarySections: input.summarySections,
    flagIds: input.flagIds,
    createdBy: input.createdBy,
    createdAt: nowIso(),
    decidedBy: null,
    decidedAt: null,
    decisionReason: null,
    version: 1,
    hitlRequired: true,
    ehrWrite: false,
    autonomousPrescribe: false,
    autonomousAdjust: false,
    validatedCds: false,
    synthetic: true,
  };

  if (usePg()) {
    const pool = getPgPool();
    await pool.query(
      `INSERT INTO aksh.medcare_safety_reviews
        (id, scope_key, patient_id, patient_label, status, summary_sections, flag_ids,
         created_by, created_at, version, synthetic)
       VALUES ($1,$2,$3,$4,'DRAFT',$5::jsonb,$6::jsonb,$7,$8,1,TRUE)`,
      [
        review.id,
        scopeKey,
        review.patientId,
        review.patientLabel,
        JSON.stringify(review.summarySections),
        JSON.stringify(review.flagIds),
        review.createdBy,
        review.createdAt,
      ]
    );
    await appendHistoryPg(scopeKey, {
      patientId: input.patientId,
      subjectKind: "medication_safety_flag",
      subjectId: review.id,
      action: "create",
      actor: input.createdBy,
      reason: "Draft medication safety review created",
    });
    return review;
  }

  const store = await readStore(scopeKey);
  for (const r of store.safetyReviews) {
    if (r.patientId === input.patientId && r.status === "DRAFT") {
      r.status = "SUPERSEDED";
    }
  }
  store.safetyReviews.unshift(review);
  store.history.push({
    id: `hist-${randomUUID()}`,
    patientId: input.patientId,
    subjectKind: "medication_safety_flag",
    subjectId: review.id,
    action: "create",
    actor: input.createdBy,
    reason: "Draft medication safety review created",
    createdAt: nowIso(),
    ehrWrite: false,
    synthetic: true,
  });
  await writeStore(store, scopeKey);
  return review;
}

export async function decideSafetyReview(
  input: {
    patientId: string;
    reviewId: string;
    action: MedCareDecisionAction;
    actor: string;
    reason?: string;
    editedSections?: MedCareReviewSection[];
  },
  options?: { scopeKey?: string }
): Promise<MedicationSafetyReview> {
  const scopeKey = options?.scopeKey ?? "shared";
  if (input.action === "reject" && !input.reason?.trim()) {
    const err = new Error("Reject requires a reason") as Error & { status: number };
    err.status = 400;
    throw err;
  }
  if (input.action === "edit" && (!input.editedSections || input.editedSections.length === 0)) {
    const err = new Error("Edit requires editedSections") as Error & { status: number };
    err.status = 400;
    throw err;
  }

  const flagStatus: MedicationSafetyFlagStatus =
    input.action === "accept" ? "accepted" : input.action === "edit" ? "edited" : "rejected";

  if (usePg()) {
    const pool = getPgPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        `SELECT * FROM aksh.medcare_safety_reviews WHERE id=$1 AND scope_key=$2 AND patient_id=$3`,
        [input.reviewId, scopeKey, input.patientId]
      );
      if (!rows[0]) {
        const err = new Error("Review not found") as Error & { status: number };
        err.status = 404;
        throw err;
      }
      if (rows[0].status !== "DRAFT") {
        const err = new Error("Review is not DRAFT") as Error & { status: number };
        err.status = 409;
        throw err;
      }
      const newStatus: MedCareReviewStatus =
        input.action === "reject" ? "REJECTED" : "APPROVED";
      const sections =
        input.action === "edit" && input.editedSections
          ? input.editedSections
          : (rows[0].summary_sections as MedCareReviewSection[]);
      await client.query(
        `UPDATE aksh.medcare_safety_reviews
         SET status=$1, summary_sections=$2::jsonb, decided_by=$3, decided_at=$4,
             decision_reason=$5, version=version+1
         WHERE id=$6 AND scope_key=$7`,
        [
          newStatus,
          JSON.stringify(sections),
          input.actor,
          nowIso(),
          input.reason ?? null,
          input.reviewId,
          scopeKey,
        ]
      );
      await client.query(
        `INSERT INTO aksh.medcare_safety_review_decisions
          (id, scope_key, review_id, action, actor, reason, edited_sections, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8)`,
        [
          `msrd-${randomUUID()}`,
          scopeKey,
          input.reviewId,
          input.action,
          input.actor,
          input.reason ?? null,
          input.editedSections ? JSON.stringify(input.editedSections) : null,
          nowIso(),
        ]
      );
      const flagIds = rows[0].flag_ids as string[];
      for (const fid of flagIds) {
        await client.query(
          `UPDATE aksh.medcare_safety_flags
           SET status=$1, decided_by=$2, decided_at=$3, decision_note=$4
           WHERE id=$5 AND scope_key=$6 AND patient_id=$7`,
          [flagStatus, input.actor, nowIso(), input.reason ?? null, fid, scopeKey, input.patientId]
        );
      }
      await client.query(
        `INSERT INTO aksh.medcare_approval_history
          (id, scope_key, patient_id, subject_kind, subject_id, action, actor, reason, created_at, synthetic)
         VALUES ($1,$2,$3,'medication_safety_flag',$4,$5,$6,$7,$8,TRUE)`,
        [
          `hist-${randomUUID()}`,
          scopeKey,
          input.patientId,
          input.reviewId,
          input.action,
          input.actor,
          input.reason ?? null,
          nowIso(),
        ]
      );
      await client.query("COMMIT");
      const { rows: updated } = await pool.query(
        `SELECT * FROM aksh.medcare_safety_reviews WHERE id=$1 AND scope_key=$2`,
        [input.reviewId, scopeKey]
      );
      return mapReviewRow(updated[0]);
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  const store = await readStore(scopeKey);
  const review = store.safetyReviews.find(
    (r) => r.id === input.reviewId && r.patientId === input.patientId
  );
  if (!review) {
    const err = new Error("Review not found") as Error & { status: number };
    err.status = 404;
    throw err;
  }
  if (review.status !== "DRAFT") {
    const err = new Error("Review is not DRAFT") as Error & { status: number };
    err.status = 409;
    throw err;
  }
  review.status = input.action === "reject" ? "REJECTED" : "APPROVED";
  if (input.action === "edit" && input.editedSections) {
    review.summarySections = input.editedSections;
  }
  review.decidedBy = input.actor;
  review.decidedAt = nowIso();
  review.decisionReason = input.reason ?? null;
  review.version += 1;
  store.reviewDecisions.push({
    id: `msrd-${randomUUID()}`,
    reviewId: review.id,
    action: input.action,
    actor: input.actor,
    reason: input.reason ?? null,
    editedSections: input.editedSections ?? null,
    createdAt: nowIso(),
  });
  for (const fid of review.flagIds) {
    const flag = store.safetyFlags.find((f) => f.id === fid);
    if (flag) {
      flag.status = flagStatus;
      flag.decidedBy = input.actor;
      flag.decidedAt = nowIso();
      flag.decisionNote = input.reason ?? null;
    }
  }
  store.history.push({
    id: `hist-${randomUUID()}`,
    patientId: input.patientId,
    subjectKind: "medication_safety_flag",
    subjectId: review.id,
    action: input.action,
    actor: input.actor,
    reason: input.reason ?? null,
    createdAt: nowIso(),
    ehrWrite: false,
    synthetic: true,
  });
  await writeStore(store, scopeKey);
  return review;
}

export async function createPersonalisedCarePlan(
  input: {
    patientId: string;
    patientLabel: string;
    templateId: CarePlanTemplateId;
    title: string;
    sections: PersonalisedCarePlanSection[];
    goalsLinked: string[];
    educationLinked: string[];
    createdBy: string;
  },
  options?: { scopeKey?: string }
): Promise<PersonalisedCarePlan> {
  const scopeKey = options?.scopeKey ?? "shared";
  const plan: PersonalisedCarePlan = {
    id: `pcp-${randomUUID()}`,
    patientId: input.patientId,
    patientLabel: input.patientLabel,
    templateId: input.templateId,
    title: input.title,
    status: "DRAFT",
    sections: input.sections,
    goalsLinked: input.goalsLinked,
    educationLinked: input.educationLinked,
    createdBy: input.createdBy,
    createdAt: nowIso(),
    decidedBy: null,
    decidedAt: null,
    decisionReason: null,
    version: 1,
    hitlRequired: true,
    ehrWrite: false,
    autonomousPrescribe: false,
    synthetic: true,
  };

  if (usePg()) {
    const pool = getPgPool();
    await pool.query(
      `INSERT INTO aksh.medcare_care_plans
        (id, scope_key, patient_id, patient_label, template_id, title, status, sections,
         goals_linked, education_linked, created_by, created_at, version, synthetic)
       VALUES ($1,$2,$3,$4,$5,$6,'DRAFT',$7::jsonb,$8::jsonb,$9::jsonb,$10,$11,1,TRUE)`,
      [
        plan.id,
        scopeKey,
        plan.patientId,
        plan.patientLabel,
        plan.templateId,
        plan.title,
        JSON.stringify(plan.sections),
        JSON.stringify(plan.goalsLinked),
        JSON.stringify(plan.educationLinked),
        plan.createdBy,
        plan.createdAt,
      ]
    );
    await appendHistoryPg(scopeKey, {
      patientId: input.patientId,
      subjectKind: "personalised_care_plan",
      subjectId: plan.id,
      action: "create",
      actor: input.createdBy,
      reason: `Draft from template ${input.templateId}`,
    });
    return plan;
  }

  const store = await readStore(scopeKey);
  store.carePlans.unshift(plan);
  store.history.push({
    id: `hist-${randomUUID()}`,
    patientId: input.patientId,
    subjectKind: "personalised_care_plan",
    subjectId: plan.id,
    action: "create",
    actor: input.createdBy,
    reason: `Draft from template ${input.templateId}`,
    createdAt: nowIso(),
    ehrWrite: false,
    synthetic: true,
  });
  await writeStore(store, scopeKey);
  return plan;
}

export async function decidePersonalisedCarePlan(
  input: {
    patientId: string;
    planId: string;
    action: MedCareDecisionAction;
    actor: string;
    reason?: string;
    editedSections?: PersonalisedCarePlanSection[];
  },
  options?: { scopeKey?: string }
): Promise<PersonalisedCarePlan> {
  const scopeKey = options?.scopeKey ?? "shared";
  if (input.action === "reject" && !input.reason?.trim()) {
    const err = new Error("Reject requires a reason") as Error & { status: number };
    err.status = 400;
    throw err;
  }
  if (input.action === "edit" && (!input.editedSections || input.editedSections.length === 0)) {
    const err = new Error("Edit requires editedSections") as Error & { status: number };
    err.status = 400;
    throw err;
  }

  if (usePg()) {
    const pool = getPgPool();
    const { rows } = await pool.query(
      `SELECT * FROM aksh.medcare_care_plans WHERE id=$1 AND scope_key=$2 AND patient_id=$3`,
      [input.planId, scopeKey, input.patientId]
    );
    if (!rows[0]) {
      const err = new Error("Care plan not found") as Error & { status: number };
      err.status = 404;
      throw err;
    }
    if (rows[0].status !== "DRAFT") {
      const err = new Error("Care plan is not DRAFT") as Error & { status: number };
      err.status = 409;
      throw err;
    }
    const newStatus: MedCareReviewStatus =
      input.action === "reject" ? "REJECTED" : "APPROVED";
    const sections =
      input.action === "edit" && input.editedSections
        ? input.editedSections
        : (rows[0].sections as PersonalisedCarePlanSection[]);
    await pool.query(
      `UPDATE aksh.medcare_care_plans
       SET status=$1, sections=$2::jsonb, decided_by=$3, decided_at=$4,
           decision_reason=$5, version=version+1
       WHERE id=$6 AND scope_key=$7`,
      [
        newStatus,
        JSON.stringify(sections),
        input.actor,
        nowIso(),
        input.reason ?? null,
        input.planId,
        scopeKey,
      ]
    );
    await appendHistoryPg(scopeKey, {
      patientId: input.patientId,
      subjectKind: "personalised_care_plan",
      subjectId: input.planId,
      action: input.action,
      actor: input.actor,
      reason: input.reason ?? null,
    });
    const { rows: updated } = await pool.query(
      `SELECT * FROM aksh.medcare_care_plans WHERE id=$1 AND scope_key=$2`,
      [input.planId, scopeKey]
    );
    return mapPlanRow(updated[0]);
  }

  const store = await readStore(scopeKey);
  const plan = store.carePlans.find(
    (p) => p.id === input.planId && p.patientId === input.patientId
  );
  if (!plan) {
    const err = new Error("Care plan not found") as Error & { status: number };
    err.status = 404;
    throw err;
  }
  if (plan.status !== "DRAFT") {
    const err = new Error("Care plan is not DRAFT") as Error & { status: number };
    err.status = 409;
    throw err;
  }
  plan.status = input.action === "reject" ? "REJECTED" : "APPROVED";
  if (input.action === "edit" && input.editedSections) plan.sections = input.editedSections;
  plan.decidedBy = input.actor;
  plan.decidedAt = nowIso();
  plan.decisionReason = input.reason ?? null;
  plan.version += 1;
  store.history.push({
    id: `hist-${randomUUID()}`,
    patientId: input.patientId,
    subjectKind: "personalised_care_plan",
    subjectId: plan.id,
    action: input.action,
    actor: input.actor,
    reason: input.reason ?? null,
    createdAt: nowIso(),
    ehrWrite: false,
    synthetic: true,
  });
  await writeStore(store, scopeKey);
  return plan;
}

export async function upsertGoal(
  goal: PatientGoal,
  options?: { scopeKey?: string }
): Promise<PatientGoal> {
  const scopeKey = options?.scopeKey ?? "shared";
  if (usePg()) {
    const pool = getPgPool();
    await pool.query(
      `INSERT INTO aksh.medcare_patient_goals
        (id, scope_key, patient_id, title, description, category, status, target_date, created_at, updated_at, synthetic)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE)
       ON CONFLICT (id) DO UPDATE SET
         title=EXCLUDED.title, description=EXCLUDED.description, status=EXCLUDED.status,
         target_date=EXCLUDED.target_date, updated_at=EXCLUDED.updated_at`,
      [
        goal.id,
        scopeKey,
        goal.patientId,
        goal.title,
        goal.description,
        goal.category,
        goal.status,
        goal.targetDate,
        goal.createdAt,
        goal.updatedAt,
      ]
    );
    return goal;
  }
  const store = await readStore(scopeKey);
  const idx = store.goals.findIndex((g) => g.id === goal.id);
  if (idx >= 0) store.goals[idx] = goal;
  else store.goals.push(goal);
  await writeStore(store, scopeKey);
  return goal;
}

export async function createTask(
  task: Omit<AssignedCareTask, "id" | "createdAt" | "updatedAt" | "closedAt" | "synthetic" | "ehrWrite"> & {
    id?: string;
  },
  options?: { scopeKey?: string; actor?: string }
): Promise<AssignedCareTask> {
  const scopeKey = options?.scopeKey ?? "shared";
  const now = nowIso();
  const row: AssignedCareTask = {
    id: task.id ?? `task-${randomUUID()}`,
    patientId: task.patientId,
    title: task.title,
    description: task.description,
    ownerRole: task.ownerRole,
    ownerDisplay: task.ownerDisplay,
    status: task.status,
    dueAt: task.dueAt,
    relatedPlanId: task.relatedPlanId,
    relatedFlagId: task.relatedFlagId,
    createdAt: now,
    updatedAt: now,
    closedAt: null,
    note: task.note ?? null,
    synthetic: true,
    ehrWrite: false,
  };

  if (usePg()) {
    const pool = getPgPool();
    await pool.query(
      `INSERT INTO aksh.medcare_assigned_tasks
        (id, scope_key, patient_id, title, description, owner_role, owner_display, status,
         due_at, related_plan_id, related_flag_id, created_at, updated_at, closed_at, note, synthetic)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NULL,$14,TRUE)`,
      [
        row.id,
        scopeKey,
        row.patientId,
        row.title,
        row.description,
        row.ownerRole,
        row.ownerDisplay,
        row.status,
        row.dueAt,
        row.relatedPlanId,
        row.relatedFlagId,
        row.createdAt,
        row.updatedAt,
        row.note,
      ]
    );
    await appendHistoryPg(scopeKey, {
      patientId: row.patientId,
      subjectKind: "personalised_care_plan",
      subjectId: row.id,
      action: "create",
      actor: options?.actor ?? "system",
      reason: "Assigned care task created",
    });
    return row;
  }

  const store = await readStore(scopeKey);
  store.tasks.unshift(row);
  store.history.push({
    id: `hist-${randomUUID()}`,
    patientId: row.patientId,
    subjectKind: "personalised_care_plan",
    subjectId: row.id,
    action: "create",
    actor: options?.actor ?? "system",
    reason: "Assigned care task created",
    createdAt: now,
    ehrWrite: false,
    synthetic: true,
  });
  await writeStore(store, scopeKey);
  return row;
}

export async function updateTaskStatus(
  input: {
    patientId: string;
    taskId: string;
    status: CareTaskStatus;
    note?: string;
    actor: string;
  },
  options?: { scopeKey?: string }
): Promise<AssignedCareTask> {
  const scopeKey = options?.scopeKey ?? "shared";
  const now = nowIso();
  const closed =
    input.status === "completed" || input.status === "cancelled" ? now : null;

  if (usePg()) {
    const pool = getPgPool();
    const { rows } = await pool.query(
      `UPDATE aksh.medcare_assigned_tasks
       SET status=$1, note=COALESCE($2, note), updated_at=$3, closed_at=$4
       WHERE id=$5 AND scope_key=$6 AND patient_id=$7
       RETURNING *`,
      [input.status, input.note ?? null, now, closed, input.taskId, scopeKey, input.patientId]
    );
    if (!rows[0]) {
      const err = new Error("Task not found") as Error & { status: number };
      err.status = 404;
      throw err;
    }
    await appendHistoryPg(scopeKey, {
      patientId: input.patientId,
      subjectKind: "personalised_care_plan",
      subjectId: input.taskId,
      action: "task_update",
      actor: input.actor,
      reason: input.note ?? `status=${input.status}`,
    });
    return mapTaskRow(rows[0]);
  }

  const store = await readStore(scopeKey);
  const task = store.tasks.find(
    (t) => t.id === input.taskId && t.patientId === input.patientId
  );
  if (!task) {
    const err = new Error("Task not found") as Error & { status: number };
    err.status = 404;
    throw err;
  }
  task.status = input.status;
  task.updatedAt = now;
  task.closedAt = closed;
  if (input.note !== undefined) task.note = input.note;
  store.history.push({
    id: `hist-${randomUUID()}`,
    patientId: input.patientId,
    subjectKind: "personalised_care_plan",
    subjectId: task.id,
    action: "task_update",
    actor: input.actor,
    reason: input.note ?? `status=${input.status}`,
    createdAt: now,
    ehrWrite: false,
    synthetic: true,
  });
  await writeStore(store, scopeKey);
  return task;
}

export async function createHandoff(
  input: {
    patientId: string;
    fromRole: string;
    toRole: string;
    toMemberDisplay: string | null;
    summary: string;
    relatedTaskId: string | null;
    actor: string;
  },
  options?: { scopeKey?: string }
): Promise<CareTeamHandoff> {
  const scopeKey = options?.scopeKey ?? "shared";
  const row: CareTeamHandoff = {
    id: `hand-${randomUUID()}`,
    patientId: input.patientId,
    fromRole: input.fromRole,
    toRole: input.toRole,
    toMemberDisplay: input.toMemberDisplay,
    summary: input.summary,
    relatedTaskId: input.relatedTaskId,
    createdAt: nowIso(),
    acknowledgedAt: null,
    synthetic: true,
    ehrWrite: false,
  };

  if (usePg()) {
    const pool = getPgPool();
    await pool.query(
      `INSERT INTO aksh.medcare_handoffs
        (id, scope_key, patient_id, from_role, to_role, to_member_display, summary,
         related_task_id, created_at, acknowledged_at, synthetic)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NULL,TRUE)`,
      [
        row.id,
        scopeKey,
        row.patientId,
        row.fromRole,
        row.toRole,
        row.toMemberDisplay,
        row.summary,
        row.relatedTaskId,
        row.createdAt,
      ]
    );
    if (input.relatedTaskId) {
      await pool.query(
        `UPDATE aksh.medcare_assigned_tasks SET status='handed_off', updated_at=$1
         WHERE id=$2 AND scope_key=$3 AND patient_id=$4`,
        [nowIso(), input.relatedTaskId, scopeKey, input.patientId]
      );
    }
    await appendHistoryPg(scopeKey, {
      patientId: input.patientId,
      subjectKind: "personalised_care_plan",
      subjectId: row.id,
      action: "handoff",
      actor: input.actor,
      reason: input.summary,
    });
    return row;
  }

  const store = await readStore(scopeKey);
  store.handoffs.unshift(row);
  if (input.relatedTaskId) {
    const task = store.tasks.find((t) => t.id === input.relatedTaskId);
    if (task) {
      task.status = "handed_off";
      task.updatedAt = nowIso();
    }
  }
  store.history.push({
    id: `hist-${randomUUID()}`,
    patientId: input.patientId,
    subjectKind: "personalised_care_plan",
    subjectId: row.id,
    action: "handoff",
    actor: input.actor,
    reason: input.summary,
    createdAt: nowIso(),
    ehrWrite: false,
    synthetic: true,
  });
  await writeStore(store, scopeKey);
  return row;
}

async function appendHistoryPg(
  scopeKey: string,
  entry: {
    patientId: string;
    subjectKind: MedCareApprovalHistoryEntry["subjectKind"];
    subjectId: string;
    action: MedCareApprovalHistoryEntry["action"];
    actor: string;
    reason: string | null;
  }
) {
  const pool = getPgPool();
  await pool.query(
    `INSERT INTO aksh.medcare_approval_history
      (id, scope_key, patient_id, subject_kind, subject_id, action, actor, reason, created_at, synthetic)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,TRUE)`,
    [
      `hist-${randomUUID()}`,
      scopeKey,
      entry.patientId,
      entry.subjectKind,
      entry.subjectId,
      entry.action,
      entry.actor,
      entry.reason,
      nowIso(),
    ]
  );
}

function mapFlagRow(r: Record<string, unknown>): MedicationSafetyFlag {
  return {
    id: String(r.id),
    patientId: String(r.patient_id),
    code: String(r.code),
    severity: r.severity as MedicationSafetyFlag["severity"],
    title: String(r.title),
    detail: String(r.detail),
    relatedMedications: Array.isArray(r.related_medications)
      ? (r.related_medications as string[])
      : [],
    status: r.status as MedicationSafetyFlagStatus,
    createdAt: new Date(String(r.created_at)).toISOString(),
    decidedBy: r.decided_by == null ? null : String(r.decided_by),
    decidedAt: r.decided_at == null ? null : new Date(String(r.decided_at)).toISOString(),
    decisionNote: r.decision_note == null ? null : String(r.decision_note),
    hitlRequired: true,
    ehrWrite: false,
    autonomousPrescribe: false,
    autonomousAdjust: false,
    validatedCds: false,
    synthetic: true,
  };
}

function mapGoalRow(r: Record<string, unknown>): PatientGoal {
  return {
    id: String(r.id),
    patientId: String(r.patient_id),
    title: String(r.title),
    description: String(r.description),
    category: r.category as PatientGoal["category"],
    status: r.status as PatientGoalStatus,
    targetDate: r.target_date == null ? null : String(r.target_date).slice(0, 10),
    createdAt: new Date(String(r.created_at)).toISOString(),
    updatedAt: new Date(String(r.updated_at)).toISOString(),
    synthetic: true,
  };
}

function mapPlanRow(r: Record<string, unknown>): PersonalisedCarePlan {
  return {
    id: String(r.id),
    patientId: String(r.patient_id),
    patientLabel: String(r.patient_label),
    templateId: r.template_id as CarePlanTemplateId,
    title: String(r.title),
    status: r.status as MedCareReviewStatus,
    sections: (r.sections as PersonalisedCarePlanSection[]) ?? [],
    goalsLinked: Array.isArray(r.goals_linked) ? (r.goals_linked as string[]) : [],
    educationLinked: Array.isArray(r.education_linked) ? (r.education_linked as string[]) : [],
    createdBy: String(r.created_by),
    createdAt: new Date(String(r.created_at)).toISOString(),
    decidedBy: r.decided_by == null ? null : String(r.decided_by),
    decidedAt: r.decided_at == null ? null : new Date(String(r.decided_at)).toISOString(),
    decisionReason: r.decision_reason == null ? null : String(r.decision_reason),
    version: Number(r.version ?? 1),
    hitlRequired: true,
    ehrWrite: false,
    autonomousPrescribe: false,
    synthetic: true,
  };
}

function mapTaskRow(r: Record<string, unknown>): AssignedCareTask {
  return {
    id: String(r.id),
    patientId: String(r.patient_id),
    title: String(r.title),
    description: String(r.description),
    ownerRole: String(r.owner_role),
    ownerDisplay: r.owner_display == null ? null : String(r.owner_display),
    status: r.status as CareTaskStatus,
    dueAt: r.due_at == null ? null : new Date(String(r.due_at)).toISOString(),
    relatedPlanId: r.related_plan_id == null ? null : String(r.related_plan_id),
    relatedFlagId: r.related_flag_id == null ? null : String(r.related_flag_id),
    createdAt: new Date(String(r.created_at)).toISOString(),
    updatedAt: new Date(String(r.updated_at)).toISOString(),
    closedAt: r.closed_at == null ? null : new Date(String(r.closed_at)).toISOString(),
    note: r.note == null ? null : String(r.note),
    synthetic: true,
    ehrWrite: false,
  };
}

function mapHandoffRow(r: Record<string, unknown>): CareTeamHandoff {
  return {
    id: String(r.id),
    patientId: String(r.patient_id),
    fromRole: String(r.from_role),
    toRole: String(r.to_role),
    toMemberDisplay: r.to_member_display == null ? null : String(r.to_member_display),
    summary: String(r.summary),
    relatedTaskId: r.related_task_id == null ? null : String(r.related_task_id),
    createdAt: new Date(String(r.created_at)).toISOString(),
    acknowledgedAt:
      r.acknowledged_at == null ? null : new Date(String(r.acknowledged_at)).toISOString(),
    synthetic: true,
    ehrWrite: false,
  };
}

function mapHistoryRow(r: Record<string, unknown>): MedCareApprovalHistoryEntry {
  return {
    id: String(r.id),
    patientId: String(r.patient_id),
    subjectKind: r.subject_kind as MedCareApprovalHistoryEntry["subjectKind"],
    subjectId: String(r.subject_id),
    action: r.action as MedCareApprovalHistoryEntry["action"],
    actor: String(r.actor),
    reason: r.reason == null ? null : String(r.reason),
    createdAt: new Date(String(r.created_at)).toISOString(),
    ehrWrite: false,
    synthetic: true,
    metadata: (r.metadata as Record<string, unknown>) ?? undefined,
  };
}

function mapReviewRow(r: Record<string, unknown>): MedicationSafetyReview {
  return {
    id: String(r.id),
    patientId: String(r.patient_id),
    patientLabel: String(r.patient_label),
    status: r.status as MedCareReviewStatus,
    summarySections: (r.summary_sections as MedCareReviewSection[]) ?? [],
    flagIds: Array.isArray(r.flag_ids) ? (r.flag_ids as string[]) : [],
    createdBy: String(r.created_by),
    createdAt: new Date(String(r.created_at)).toISOString(),
    decidedBy: r.decided_by == null ? null : String(r.decided_by),
    decidedAt: r.decided_at == null ? null : new Date(String(r.decided_at)).toISOString(),
    decisionReason: r.decision_reason == null ? null : String(r.decision_reason),
    version: Number(r.version ?? 1),
    hitlRequired: true,
    ehrWrite: false,
    autonomousPrescribe: false,
    autonomousAdjust: false,
    validatedCds: false,
    synthetic: true,
  };
}
