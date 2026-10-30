/**
 * INT-04a follow-through — canonical follow-up write path.
 *
 * Physical SoT: `aksh.care_follow_up_tasks`. Continuous-care `ccare_follow_up_items`
 * is an ops worklist projection (mirrored via follow-up-bridge on create/advance).
 * No Neon drops — additive `entry_surface` (051, local-dev/sim only).
 * ehrWrite stays false; HITL journey Accept/Edit remains the create gate for plan follow-ups.
 */

import { randomUUID } from "crypto";
import { mirrorJourneyFollowUpToContinuous, FOLLOW_UP_JOURNEY_STORE, FOLLOW_UP_CONTINUOUS_STORE } from "./follow-up-bridge";
import { resolveConnectedDiabetesOrganisationId } from "./org-tenancy";
import { listFollowUps, persistFollowUpTask, updateFollowUp } from "./repository";
import type { CareFollowUpTask } from "./types";

export const FOLLOW_UP_CANONICAL_STORE = FOLLOW_UP_JOURNEY_STORE;
export const FOLLOW_UP_OPS_PROJECTION_STORE = FOLLOW_UP_CONTINUOUS_STORE;

export type FollowUpEntrySurface = "journey" | "continuous_care" | "shared";

export type CreateCanonicalFollowUpResult = {
  task: CareFollowUpTask;
  physicalStore: typeof FOLLOW_UP_CANONICAL_STORE;
  opsProjectionStore: typeof FOLLOW_UP_OPS_PROJECTION_STORE;
  mirrored: true;
  ehrWrite: false;
};

export type AdvanceCanonicalFollowUpResult = {
  task: CareFollowUpTask;
  physicalStore: typeof FOLLOW_UP_CANONICAL_STORE;
  opsProjectionStore: typeof FOLLOW_UP_OPS_PROJECTION_STORE;
  mirrored: true;
  ehrWrite: false;
};

function buildFollowUpTask(input: {
  patientId: string;
  planId: string | null;
  owner: string;
  title?: string;
  now: string;
  organisationId?: string | null;
  entrySurface: FollowUpEntrySurface;
}): CareFollowUpTask {
  const due = new Date(input.now);
  due.setDate(due.getDate() + 14);
  return {
    id: `cfu-${randomUUID()}`,
    patientId: input.patientId,
    planId: input.planId,
    title: input.title ?? "Diabetes care-plan follow-up (clinician-confirmed)",
    owner: input.owner,
    status: "open",
    dueAt: due.toISOString(),
    createdAt: input.now,
    acknowledgedAt: null,
    closedAt: null,
    note: null,
    organisationId: input.organisationId ?? null,
    entrySurface: input.entrySurface,
    synthetic: true,
  };
}

/**
 * Single write path: insert into care_follow_up_tasks then mirror into ccare ops.
 * Prefer this over writing either store independently for HITL plan follow-ups.
 */
export async function createCanonicalFollowUp(
  input: {
    patientId: string;
    planId: string | null;
    owner: string;
    title?: string;
    entrySurface?: FollowUpEntrySurface;
  },
  options?: { scopeKey?: string; organisationId?: string | null; actor?: string }
): Promise<CreateCanonicalFollowUpResult> {
  const scopeKey = options?.scopeKey ?? "shared";
  const organisationId = resolveConnectedDiabetesOrganisationId({
    organisationId: options?.organisationId ?? undefined,
  });
  const now = new Date().toISOString();
  const task = buildFollowUpTask({
    patientId: input.patientId,
    planId: input.planId,
    owner: input.owner,
    title: input.title,
    now,
    organisationId,
    entrySurface: input.entrySurface ?? "journey",
  });

  await persistFollowUpTask(task, { scopeKey, organisationId });
  await mirrorJourneyFollowUpToContinuous(task, {
    scopeKey,
    actor: options?.actor ?? input.owner,
  });

  return {
    task,
    physicalStore: FOLLOW_UP_CANONICAL_STORE,
    opsProjectionStore: FOLLOW_UP_OPS_PROJECTION_STORE,
    mirrored: true,
    ehrWrite: false,
  };
}

/** Advance canonical task and re-mirror status into continuous-care ops projection. */
export async function advanceCanonicalFollowUp(
  input: {
    taskId: string;
    action: "acknowledge" | "complete" | "cancel";
    note?: string;
  },
  options?: { scopeKey?: string; actor?: string }
): Promise<AdvanceCanonicalFollowUpResult> {
  const scopeKey = options?.scopeKey ?? "shared";
  const task = await updateFollowUp(input, { scopeKey });
  await mirrorJourneyFollowUpToContinuous(task, {
    scopeKey,
    actor: options?.actor ?? task.owner,
  });
  return {
    task,
    physicalStore: FOLLOW_UP_CANONICAL_STORE,
    opsProjectionStore: FOLLOW_UP_OPS_PROJECTION_STORE,
    mirrored: true,
    ehrWrite: false,
  };
}

export async function listCanonicalFollowUps(
  patientId: string,
  options?: { scopeKey?: string }
): Promise<CareFollowUpTask[]> {
  return listFollowUps(patientId, options);
}
