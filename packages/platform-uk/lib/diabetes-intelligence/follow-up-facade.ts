/**
 * INT-04a follow-through — unified follow-up read over canonical SoT + ops projection.
 *
 * Physical SoT: `care_follow_up_tasks` (single write path via follow-up-canonical).
 * Ops projection: `ccare_follow_up_items` (mirrored on create/advance; native ops
 * items without journey source_ref remain listed). No destructive Neon merge.
 */

import { getPatientById } from "../mock-data";
import { listFollowUps as listJourneyFollowUps } from "./repository";
import { listFollowUpItems as listContinuousFollowUps } from "./continuous-care-repository";
import type { CareFollowUpTask } from "./types";
import type { FollowUpWorklistItem } from "./continuous-care-types";

export type UnifiedFollowUpSourceStore = "journey_follow_up" | "continuous_care_follow_up";

export type UnifiedFollowUp = {
  id: string;
  patientId: string;
  patientLabel: string;
  sourceStore: UnifiedFollowUpSourceStore;
  /** Stable composite key — avoids colliding bare ids across stores. */
  unifiedKey: string;
  title: string;
  status: string;
  owner: string;
  dueAt: string | null;
  createdAt: string;
  closedAt: string | null;
  planOrSourceRefId: string | null;
  hitlRequired: true;
  ehrWrite: false;
  synthetic: true;
  provenance: "journey_hitl" | "continuous_care_ops";
  /** After INT-04a collapse: journey rows are physical SoT; ccare may be projection. */
  physicalStore: "care_follow_up_tasks" | "ccare_follow_up_items";
  isOpsProjection?: boolean;
};

function labelFor(patientId: string, fallback?: string): string {
  return fallback?.trim() || getPatientById(patientId)?.name?.trim() || patientId;
}

export function toUnifiedFromJourney(task: CareFollowUpTask): UnifiedFollowUp {
  return {
    id: task.id,
    patientId: task.patientId,
    patientLabel: labelFor(task.patientId),
    sourceStore: "journey_follow_up",
    unifiedKey: `journey:${task.id}`,
    title: task.title,
    status: task.status,
    owner: task.owner,
    dueAt: task.dueAt,
    createdAt: task.createdAt,
    closedAt: task.closedAt,
    planOrSourceRefId: task.planId,
    hitlRequired: true,
    ehrWrite: false,
    synthetic: true,
    provenance: "journey_hitl",
    physicalStore: "care_follow_up_tasks",
    isOpsProjection: false,
  };
}

export function toUnifiedFromContinuous(item: FollowUpWorklistItem): UnifiedFollowUp {
  const isProjection = item.sourceKind === "journey_follow_up";
  return {
    id: item.id,
    patientId: item.patientId,
    patientLabel: item.patientLabel,
    sourceStore: "continuous_care_follow_up",
    unifiedKey: `ccare:${item.id}`,
    title: item.title,
    status: item.status,
    owner: item.ownerDisplay ?? item.ownerRole,
    dueAt: item.dueAt,
    createdAt: item.createdAt,
    closedAt: item.closedAt,
    planOrSourceRefId: item.sourceRefId,
    hitlRequired: true,
    ehrWrite: false,
    synthetic: true,
    provenance: "continuous_care_ops",
    physicalStore: "ccare_follow_up_items",
    isOpsProjection: isProjection,
  };
}

export async function listUnifiedFollowUps(
  patientId: string,
  options?: { scopeKey?: string }
): Promise<UnifiedFollowUp[]> {
  const scopeKey = options?.scopeKey ?? "shared";
  const [journey, continuous] = await Promise.all([
    listJourneyFollowUps(patientId, { scopeKey }),
    listContinuousFollowUps(patientId, { scopeKey }),
  ]);
  return [
    ...journey.map(toUnifiedFromJourney),
    ...continuous.map(toUnifiedFromContinuous),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Journey store is the connected-pipeline HITL follow-up source of truth. */
export function selectCanonicalJourneyFollowUps(items: UnifiedFollowUp[]): UnifiedFollowUp[] {
  return items.filter((i) => i.sourceStore === "journey_follow_up");
}

export function selectContinuousFollowUps(items: UnifiedFollowUp[]): UnifiedFollowUp[] {
  return items.filter((i) => i.sourceStore === "continuous_care_follow_up");
}
