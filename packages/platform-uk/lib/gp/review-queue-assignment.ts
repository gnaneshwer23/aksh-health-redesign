/**
 * Milestone A3 — GP review-queue team assignment / delegation / escalation.
 *
 * Org + patient boundaries enforced; every mutation writes an audit entry.
 * File-backed store (mirrors care-episode / durable-run pattern). No second queue.
 */
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export type ReviewQueueAssignmentAction = "assign" | "reassign" | "escalate";

export type ReviewQueueAssignment = {
  id: string;
  caseId: string;
  patientId: string | null;
  practiceId: string;
  organisationId: string | null;
  scopeKey: string;
  assigneeUserId: string;
  assigneeRole: "gp" | "clinical_reviewer" | "clinical-pharmacist" | "nurse";
  priority: "routine" | "urgent" | "escalated";
  status: "open" | "accepted" | "released";
  careEpisodeId: string | null;
  updatedAt: string;
  createdAt: string;
  synthetic: true;
  ehrWrite: false;
};

export type ReviewQueueAssignmentAudit = {
  id: string;
  assignmentId: string;
  caseId: string;
  action: ReviewQueueAssignmentAction;
  actorUserId: string;
  fromAssigneeUserId: string | null;
  toAssigneeUserId: string;
  practiceId: string;
  organisationId: string | null;
  reason: string | null;
  at: string;
  synthetic: true;
  ehrWrite: false;
};

type Store = {
  assignments: ReviewQueueAssignment[];
  audits: ReviewQueueAssignmentAudit[];
};

const dataDir = path.join(process.cwd(), "data");

function resolveFile(scopeKey = "shared") {
  const safe = /^[a-zA-Z0-9_-]{3,64}$/.test(scopeKey) ? scopeKey : "shared";
  return path.join(
    dataDir,
    safe === "shared" ? "review-queue-assignments.json" : `review-queue-assignments.${safe}.json`
  );
}

async function readStore(scopeKey: string): Promise<Store> {
  const file = resolveFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  try {
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw) as Partial<Store>;
    return {
      assignments: Array.isArray(parsed.assignments) ? parsed.assignments : [],
      audits: Array.isArray(parsed.audits) ? parsed.audits : [],
    };
  } catch {
    return { assignments: [], audits: [] };
  }
}

async function writeStore(store: Store, scopeKey: string) {
  const file = resolveFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  await writeFile(file, JSON.stringify(store, null, 2), "utf8");
}

export class ReviewQueueAssignmentError extends Error {
  readonly code: "FORBIDDEN" | "NOT_FOUND" | "VALIDATION";
  constructor(code: ReviewQueueAssignmentError["code"], message: string) {
    super(message);
    this.name = "ReviewQueueAssignmentError";
    this.code = code;
  }
}

export type MutateAssignmentInput = {
  caseId: string;
  patientId?: string | null;
  practiceId: string;
  organisationId?: string | null;
  scopeKey?: string;
  actorUserId: string;
  assigneeUserId: string;
  assigneeRole?: ReviewQueueAssignment["assigneeRole"];
  action: ReviewQueueAssignmentAction;
  reason?: string | null;
  careEpisodeId?: string | null;
  /** Caller's practice — must match case practice. */
  actorPracticeId: string;
  /** Optional patient boundary: actor may only touch listed patients. */
  allowedPatientIds?: string[] | null;
};

function assertBoundaries(input: MutateAssignmentInput) {
  if (!input.caseId.trim()) {
    throw new ReviewQueueAssignmentError("VALIDATION", "caseId is required");
  }
  if (!input.assigneeUserId.trim()) {
    throw new ReviewQueueAssignmentError("VALIDATION", "assigneeUserId is required");
  }
  if (!input.actorPracticeId.trim() || input.actorPracticeId !== input.practiceId) {
    throw new ReviewQueueAssignmentError(
      "FORBIDDEN",
      "Assignment denied: practice/organisation boundary"
    );
  }
  if (
    input.allowedPatientIds &&
    input.patientId &&
    !input.allowedPatientIds.includes(input.patientId)
  ) {
    throw new ReviewQueueAssignmentError("FORBIDDEN", "Assignment denied: patient boundary");
  }
  if (input.action === "escalate" && !input.reason?.trim()) {
    throw new ReviewQueueAssignmentError("VALIDATION", "Escalate requires a reason");
  }
}

export async function mutateReviewQueueAssignment(
  input: MutateAssignmentInput
): Promise<{ assignment: ReviewQueueAssignment; audit: ReviewQueueAssignmentAudit }> {
  assertBoundaries(input);
  const scopeKey = input.scopeKey ?? "shared";
  const store = await readStore(scopeKey);
  const now = new Date().toISOString();
  const existingIdx = store.assignments.findIndex(
    (a) => a.caseId === input.caseId && a.status === "open"
  );
  const existing = existingIdx >= 0 ? store.assignments[existingIdx] : null;

  if (input.action === "reassign" && !existing) {
    throw new ReviewQueueAssignmentError("NOT_FOUND", "No open assignment to reassign");
  }
  if (input.action === "escalate" && !existing) {
    throw new ReviewQueueAssignmentError("NOT_FOUND", "No open assignment to escalate");
  }

  const fromAssignee = existing?.assigneeUserId ?? null;
  const assignment: ReviewQueueAssignment = {
    id: existing?.id ?? `rqa-${randomUUID()}`,
    caseId: input.caseId,
    patientId: input.patientId ?? existing?.patientId ?? null,
    practiceId: input.practiceId,
    organisationId: input.organisationId ?? existing?.organisationId ?? null,
    scopeKey,
    assigneeUserId: input.assigneeUserId.trim(),
    assigneeRole: input.assigneeRole ?? existing?.assigneeRole ?? "gp",
    priority: input.action === "escalate" ? "escalated" : existing?.priority ?? "routine",
    status: "open",
    careEpisodeId: input.careEpisodeId ?? existing?.careEpisodeId ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    synthetic: true,
    ehrWrite: false,
  };

  const audit: ReviewQueueAssignmentAudit = {
    id: `rqaa-${randomUUID()}`,
    assignmentId: assignment.id,
    caseId: assignment.caseId,
    action: input.action,
    actorUserId: input.actorUserId,
    fromAssigneeUserId: fromAssignee,
    toAssigneeUserId: assignment.assigneeUserId,
    practiceId: assignment.practiceId,
    organisationId: assignment.organisationId,
    reason: input.reason?.trim() ?? null,
    at: now,
    synthetic: true,
    ehrWrite: false,
  };

  if (existingIdx >= 0) {
    store.assignments[existingIdx] = assignment;
  } else {
    store.assignments.unshift(assignment);
  }
  store.audits.unshift(audit);
  await writeStore(store, scopeKey);
  return { assignment, audit };
}

export async function listReviewQueueAssignments(
  scopeKey = "shared",
  filter?: { practiceId?: string; assigneeUserId?: string; caseId?: string }
): Promise<ReviewQueueAssignment[]> {
  const store = await readStore(scopeKey);
  return store.assignments.filter((a) => {
    if (filter?.practiceId && a.practiceId !== filter.practiceId) return false;
    if (filter?.assigneeUserId && a.assigneeUserId !== filter.assigneeUserId) return false;
    if (filter?.caseId && a.caseId !== filter.caseId) return false;
    return a.status === "open";
  });
}

export async function listReviewQueueAssignmentAudits(
  scopeKey = "shared",
  caseId?: string
): Promise<ReviewQueueAssignmentAudit[]> {
  const store = await readStore(scopeKey);
  return store.audits.filter((a) => (caseId ? a.caseId === caseId : true));
}

export async function resetReviewQueueAssignmentsForTests(scopeKey = "shared"): Promise<void> {
  await writeStore({ assignments: [], audits: [] }, scopeKey);
}
