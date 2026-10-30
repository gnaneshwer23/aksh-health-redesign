/**
 * INT-04-adjacent — dual-write journey HITL follow-ups into continuous-care ops.
 *
 * Mirror of glucose-bridge: journey Accept/Edit creates `care_follow_up_tasks`
 * (HITL SoT) and also upserts a linked `ccare_follow_up_items` row so the ops
 * worklist stays consistent. No Neon schema drops; ehrWrite stays false.
 */

import { getPatientById } from "../mock-data";
import { upsertFollowUpWorklistItem } from "./continuous-care-repository";
import { resolveConnectedDiabetesOrganisationId } from "./org-tenancy";
import type { CareFollowUpTask } from "./types";
import type { FollowUpWorklistItem } from "./continuous-care-types";

export const FOLLOW_UP_JOURNEY_STORE = "care_follow_up_tasks" as const;
export const FOLLOW_UP_CONTINUOUS_STORE = "ccare_follow_up_items" as const;

export type FollowUpBridgeWriteResult = {
  journeyTask: CareFollowUpTask;
  continuousItem: FollowUpWorklistItem;
  journeyStore: typeof FOLLOW_UP_JOURNEY_STORE;
  continuousStore: typeof FOLLOW_UP_CONTINUOUS_STORE;
  ehrWrite: false;
};

function mapJourneyStatus(
  status: CareFollowUpTask["status"]
): FollowUpWorklistItem["status"] {
  if (status === "acknowledged") return "acknowledged";
  if (status === "completed") return "completed";
  if (status === "cancelled") return "cancelled";
  return "open";
}

/** Upsert a continuous-care worklist mirror for a clinician-confirmed journey follow-up. */
export async function mirrorJourneyFollowUpToContinuous(
  task: CareFollowUpTask,
  options?: { scopeKey?: string; actor?: string }
): Promise<FollowUpBridgeWriteResult> {
  const scopeKey = options?.scopeKey ?? "shared";
  const actor = options?.actor ?? task.owner;
  const now = new Date().toISOString();
  const patientLabel =
    getPatientById(task.patientId)?.name?.trim() || task.patientId;

  const continuousItem = await upsertFollowUpWorklistItem(
    {
      id: `ccfu-bridge-${task.id}`,
      patientId: task.patientId,
      patientLabel,
      title: task.title,
      sourceKind: "journey_follow_up",
      sourceRefId: task.id,
      ownerRole: "gp",
      ownerDisplay: task.owner,
      status: mapJourneyStatus(task.status),
      priority: "soon",
      dueAt: task.dueAt,
      createdAt: task.createdAt,
      updatedAt: now,
      closedAt: task.closedAt,
      decisionHistory: [
        {
          id: `d-bridge-${task.id}`,
          action: "mirror_from_journey",
          actor,
          reason: "Dual-write from journey HITL follow-up (synthetic)",
          at: now,
        },
      ],
      measurableOutcome: {
        metric: "follow_up_completed",
        value: task.status === "completed",
        achieved: task.status === "completed" ? true : null,
      },
      note: task.note ?? "Mirrored from journey care-plan follow-up — synthetic",
      synthetic: true,
      ehrWrite: false,
      autonomousClinicalAction: false,
    },
    {
      scopeKey,
      organisationId:
        task.organisationId ?? resolveConnectedDiabetesOrganisationId(),
    }
  );

  return {
    journeyTask: task,
    continuousItem,
    journeyStore: FOLLOW_UP_JOURNEY_STORE,
    continuousStore: FOLLOW_UP_CONTINUOUS_STORE,
    ehrWrite: false,
  };
}
