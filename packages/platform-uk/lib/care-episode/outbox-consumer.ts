/**
 * Milestone A3 — care-episode outbox consumer (design + minimal in-process drain).
 *
 * Does NOT introduce a second orchestration queue. Consumes existing
 * `outbox_enqueued` care-episode events and fans out known handoff hooks
 * (nurse→GP, GP→pharmacist) when payload status matches.
 *
 * Production durable worker (Neon LISTEN / cron) is documented in
 * STAKEHOLDER_INTEGRATION.md; this module is the shared drain logic.
 */
import { listCareEpisodeEvents } from "./repository";
import type { CareEpisodeEvent } from "./types";
import { handoffGpToPharmacist, handoffNurseToGp } from "./stakeholder-handoffs";

export type OutboxDrainResult = {
  processed: number;
  skipped: number;
  handoffs: { kind: string; careEpisodeId: string; created: boolean }[];
  designNote: string;
  synthetic: true;
  ehrWrite: false;
  autonomous: false;
};

const DESIGN_NOTE =
  "In-process drain of care_episode.outbox_enqueued events. Future A4+ may bind the same handlers to a Neon/pg_cron or LISTEN worker — do not add a parallel CONDUCTOR queue.";

function isOutbox(event: CareEpisodeEvent): boolean {
  return event.kind === "outbox_enqueued" && event.processed !== true;
}

/**
 * Drain unprocessed outbox events for an episode and invoke handoff hooks.
 * Marks events processed in-memory return only — persistence of `processed`
 * remains with the repository caller / future worker (file events are append-only).
 */
export async function drainCareEpisodeOutbox(input: {
  careEpisodeId: string;
  patientId: string;
  actor: string;
  scopeKey?: string;
  limit?: number;
}): Promise<OutboxDrainResult> {
  const scopeKey = input.scopeKey ?? "shared";
  const events = await listCareEpisodeEvents(input.careEpisodeId, scopeKey);
  const pending = events.filter(isOutbox).slice(0, input.limit ?? 20);
  const handoffs: OutboxDrainResult["handoffs"] = [];
  let skipped = 0;

  for (const event of pending) {
    const toStatus = event.toStatus ?? (event.payload?.toStatus as string | undefined);
    if (toStatus === "encounter_active") {
      const r = await handoffNurseToGp({
        patientId: input.patientId,
        actor: input.actor,
        scopeKey,
        careEpisodeId: input.careEpisodeId,
        vitalsSampleId: `outbox-${event.id}`,
      });
      handoffs.push({ kind: "nurse_to_gp", careEpisodeId: r.careEpisodeId, created: r.created });
      continue;
    }
    if (toStatus === "in_review" || toStatus === "med_review") {
      const r = await handoffGpToPharmacist({
        patientId: input.patientId,
        actor: input.actor,
        scopeKey,
        careEpisodeId: input.careEpisodeId,
        reviewCaseId: `outbox-${event.id}`,
      });
      handoffs.push({ kind: "gp_to_pharmacist", careEpisodeId: r.careEpisodeId, created: r.created });
      continue;
    }
    skipped += 1;
  }

  return {
    processed: handoffs.length,
    skipped,
    handoffs,
    designNote: DESIGN_NOTE,
    synthetic: true,
    ehrWrite: false,
    autonomous: false,
  };
}

export function describeOutboxConsumerDesign(): {
  topic: string;
  sourceEvents: string;
  handlers: string[];
  nonGoals: string[];
  note: string;
} {
  return {
    topic: "care_episode.transition",
    sourceEvents: "CareEpisodeEvent.kind === outbox_enqueued",
    handlers: ["handoffNurseToGp", "handoffGpToPharmacist"],
    nonGoals: [
      "No second CONDUCTOR / agent queue",
      "No autonomous clinical decisions",
      "No live EHR writeback",
    ],
    note: DESIGN_NOTE,
  };
}
