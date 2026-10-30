/**
 * P2 — end-to-end stakeholder care-episode integration helpers.
 *
 * Threads one `care_episode_id` across intake → booking → nurse observations →
 * CONDUCTOR orchestrate → clinical review. Extends `correlateCareEpisodeStage`;
 * does not invent a second orchestrator.
 */
import {
  addCareEpisodeTask,
  correlateCareEpisodeStage,
  getCareEpisode,
  type CorrelateJourneyResult,
  type JourneyStage,
} from "./index";
import { bookSlot } from "@/lib/front-desk/calendar";
import {
  handoffBookingToNurse,
  listOpenNurseObservationTasks,
  type NurseObservationWorklistItem,
  buildNurseObservationWorklist,
} from "@/lib/front-desk/nurse-handoff";
import type { FrontDeskState } from "@/lib/front-desk/types";

export type StakeholderStageResult = CorrelateJourneyResult & {
  nurseTask?: NurseObservationWorklistItem | null;
};

/**
 * Correlate a Front Desk booking to an existing (or new) care episode and open
 * a nurse_observation task carrying the same care_episode_id.
 */
export async function integrateBookingWithCareEpisode(input: {
  state: FrontDeskState;
  slotId: string;
  patientId: string;
  patientLabel?: string;
  actor: string;
  scopeKey?: string;
  careEpisodeId?: string;
  bookingKey?: string;
  channel?: "staff" | "voice" | "sms" | "web_chat" | "staff_phone";
}): Promise<StakeholderStageResult & { booked: boolean; slotId: string }> {
  const scopeKey = input.scopeKey ?? "shared";
  const bookingKey = input.bookingKey ?? `p2-book:${input.patientId}:${input.slotId}`;

  const correlated = await correlateCareEpisodeStage({
    patientId: input.patientId,
    patientLabel: input.patientLabel,
    actor: input.actor,
    scopeKey,
    careEpisodeId: input.careEpisodeId,
    stage: "booking",
    linkId: input.slotId,
    linkLabel: "Front Desk booking",
  });

  const booked = bookSlot(
    input.state,
    input.slotId,
    input.patientId,
    input.channel === "staff" || !input.channel ? "staff" : input.channel,
    bookingKey,
    correlated.careEpisodeId
  );

  let nurseTask: NurseObservationWorklistItem | null = null;
  if (booked.ok && !booked.idempotent) {
    const workItem = handoffBookingToNurse(input.state, booked.slot, {
      patientLabel: input.patientLabel,
      channel: input.channel === "staff" || !input.channel ? "staff" : input.channel,
      careEpisodeId: correlated.careEpisodeId,
    });
    if (workItem) {
      await addCareEpisodeTask(
        correlated.careEpisodeId,
        {
          title: workItem.summary,
          ownerRole: "nurse",
          relatedLink: {
            kind: "appointment",
            id: input.slotId,
            label: "Nurse observation after booking",
            linkedAt: new Date().toISOString(),
          },
        },
        input.actor,
        scopeKey
      ).catch(() => undefined);
      nurseTask = buildNurseObservationWorklist(input.state).find((t) => t.id === workItem.id) ?? null;
    }
  } else if (booked.ok) {
    const existing = listOpenNurseObservationTasks(input.state).find(
      (w) =>
        w.patientId === input.patientId &&
        (w.careEpisodeId === correlated.careEpisodeId || w.slotId === input.slotId)
    );
    if (existing) {
      nurseTask = {
        id: existing.id,
        patientId: existing.patientId,
        summary: existing.summary,
        priority: existing.priority,
        careEpisodeId: existing.careEpisodeId ?? correlated.careEpisodeId,
        slotId: existing.slotId ?? input.slotId,
        at: existing.at,
        status: "open",
        source: "front_desk_booking",
        synthetic: true,
        ehrWrite: false,
      };
    }
  }

  return {
    ...correlated,
    booked: booked.ok,
    slotId: input.slotId,
    nurseTask,
  };
}

/** Advance episode to nurse_observations and return the shared id. */
export async function integrateNurseObservationsStage(input: {
  patientId: string;
  actor: string;
  scopeKey?: string;
  careEpisodeId?: string;
  vitalsSampleId?: string;
}): Promise<CorrelateJourneyResult> {
  return correlateCareEpisodeStage({
    patientId: input.patientId,
    actor: input.actor,
    scopeKey: input.scopeKey ?? "shared",
    careEpisodeId: input.careEpisodeId,
    stage: "nurse_observations",
    linkId: input.vitalsSampleId ?? `vitals-${input.patientId}`,
    linkLabel: "Nurse vitals",
  });
}

/** Advance episode to CONDUCTOR orchestrate stage. */
export async function integrateOrchestrateStage(input: {
  patientId: string;
  actor: string;
  scopeKey?: string;
  careEpisodeId?: string;
  runId?: string;
}): Promise<CorrelateJourneyResult> {
  return correlateCareEpisodeStage({
    patientId: input.patientId,
    actor: input.actor,
    scopeKey: input.scopeKey ?? "shared",
    careEpisodeId: input.careEpisodeId,
    stage: "orchestrate",
    linkId: input.runId ?? `orch-${input.patientId}`,
    linkLabel: "CONDUCTOR orchestrate",
  });
}

/** Advance episode to clinical review. */
export async function integrateClinicalReviewStage(input: {
  patientId: string;
  actor: string;
  scopeKey?: string;
  careEpisodeId?: string;
  reviewCaseId?: string;
}): Promise<CorrelateJourneyResult> {
  return correlateCareEpisodeStage({
    patientId: input.patientId,
    actor: input.actor,
    scopeKey: input.scopeKey ?? "shared",
    careEpisodeId: input.careEpisodeId,
    stage: "clinical_review",
    linkId: input.reviewCaseId ?? `review-${input.patientId}`,
    linkLabel: "GP clinical review",
  });
}

const STAGE_ORDER: JourneyStage[] = [
  "intake",
  "booking",
  "nurse_observations",
  "orchestrate",
  "clinical_review",
];

/**
 * Prove one care_episode_id survives booking → nurse → orchestrate → review
 * against an in-memory Front Desk state (synthetic only).
 */
export async function runStakeholderEpisodeJourney(input: {
  state: FrontDeskState;
  patientId: string;
  patientLabel?: string;
  actor: string;
  scopeKey: string;
  slotId: string;
  intakeCaseId?: string;
}): Promise<{
  careEpisodeId: string;
  stages: JourneyStage[];
  nurseTask: NurseObservationWorklistItem | null;
  linkKinds: string[];
}> {
  const intake = await correlateCareEpisodeStage({
    patientId: input.patientId,
    patientLabel: input.patientLabel,
    actor: input.actor,
    scopeKey: input.scopeKey,
    stage: "intake",
    linkId: input.intakeCaseId ?? `intake-${input.patientId}`,
    linkLabel: "Intake",
  });

  const booking = await integrateBookingWithCareEpisode({
    state: input.state,
    slotId: input.slotId,
    patientId: input.patientId,
    patientLabel: input.patientLabel,
    actor: input.actor,
    scopeKey: input.scopeKey,
    careEpisodeId: intake.careEpisodeId,
  });

  const nurse = await integrateNurseObservationsStage({
    patientId: input.patientId,
    actor: input.actor,
    scopeKey: input.scopeKey,
    careEpisodeId: booking.careEpisodeId,
  });

  const orch = await integrateOrchestrateStage({
    patientId: input.patientId,
    actor: input.actor,
    scopeKey: input.scopeKey,
    careEpisodeId: nurse.careEpisodeId,
  });

  const review = await integrateClinicalReviewStage({
    patientId: input.patientId,
    actor: input.actor,
    scopeKey: input.scopeKey,
    careEpisodeId: orch.careEpisodeId,
  });

  const episode = await getCareEpisode(review.careEpisodeId, input.scopeKey);
  const ids = [
    intake.careEpisodeId,
    booking.careEpisodeId,
    nurse.careEpisodeId,
    orch.careEpisodeId,
    review.careEpisodeId,
  ];
  if (new Set(ids).size !== 1) {
    throw new Error(`care_episode_id diverged across stages: ${ids.join(",")}`);
  }

  return {
    careEpisodeId: review.careEpisodeId,
    stages: STAGE_ORDER,
    nurseTask: booking.nurseTask ?? null,
    linkKinds: episode?.links.map((l) => l.kind) ?? [],
  };
}
