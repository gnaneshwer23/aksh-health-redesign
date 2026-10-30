/**
 * P0-EPISODE-01 — Care-episode correlation helpers for journey stages.
 *
 * Threads one `care_episode_id` across intake → booking → nurse observations →
 * orchestrate → clinical review when those paths exist. Does not invent a second
 * episode model — extends `lib/care-episode/*` foundation.
 */
import {
  attachCareEpisodeLink,
  createCareEpisode,
  getCareEpisode,
  listCareEpisodesForPatient,
  transitionCareEpisode,
  type CareEpisode,
  type CareEpisodeLinkKind,
  type CareEpisodeStatus,
} from "./index";

export type JourneyStage =
  | "intake"
  | "booking"
  | "nurse_observations"
  | "orchestrate"
  | "clinical_review";

const STAGE_STATUS: Record<JourneyStage, CareEpisodeStatus> = {
  intake: "intake",
  booking: "scheduled",
  nurse_observations: "encounter_active",
  orchestrate: "context_assembled",
  clinical_review: "in_review",
};

const STAGE_LINK_KIND: Record<JourneyStage, CareEpisodeLinkKind> = {
  intake: "review_case",
  booking: "appointment",
  nurse_observations: "patient_encounter",
  orchestrate: "context_package",
  clinical_review: "review_case",
};

export type CorrelateJourneyInput = {
  patientId: string;
  patientLabel?: string;
  actor: string;
  scopeKey?: string;
  /** Reuse an existing episode when provided. */
  careEpisodeId?: string;
  stage: JourneyStage;
  linkId?: string;
  linkLabel?: string;
  organisationId?: string;
  practiceId?: string;
  pathway?: string;
};

export type CorrelateJourneyResult = {
  episode: CareEpisode;
  careEpisodeId: string;
  stage: JourneyStage;
  transitioned: boolean;
  synthetic: true;
  ehrWrite: false;
};

/**
 * Ensure an open care episode for the patient (create draft→intake if needed),
 * optionally attach a stage link, and advance status when the transition is valid.
 */
export async function correlateCareEpisodeStage(
  input: CorrelateJourneyInput
): Promise<CorrelateJourneyResult> {
  const scopeKey = input.scopeKey ?? "shared";
  let episode: CareEpisode | null = null;

  if (input.careEpisodeId) {
    episode = await getCareEpisode(input.careEpisodeId, scopeKey);
  }

  if (!episode) {
    const open = (await listCareEpisodesForPatient(input.patientId, scopeKey)).find(
      (e) => e.status !== "closed" && e.status !== "cancelled"
    );
    episode = open ?? null;
  }

  if (!episode) {
    episode = await createCareEpisode({
      patientId: input.patientId,
      patientLabel: input.patientLabel,
      createdBy: input.actor,
      scopeKey,
      organisationId: input.organisationId,
      practiceId: input.practiceId,
      pathway: input.pathway ?? "synthetic_gp_journey",
      initialStatus: input.stage === "intake" ? "intake" : "draft",
      idempotencyKey: `journey:${input.patientId}:${scopeKey}:open`,
      metadata: { syntheticJourney: true },
    });
  }

  if (input.linkId) {
    episode = await attachCareEpisodeLink(
      episode.id,
      {
        kind: STAGE_LINK_KIND[input.stage],
        id: input.linkId,
        label: input.linkLabel ?? input.stage,
      },
      input.actor,
      scopeKey
    );
  }

  const target = STAGE_STATUS[input.stage];
  let transitioned = false;
  if (episode.status !== target && episode.status !== "closed" && episode.status !== "cancelled") {
    try {
      const result = await transitionCareEpisode({
        episodeId: episode.id,
        toStatus: target,
        actor: input.actor,
        scopeKey,
        reason: `Journey stage ${input.stage}`,
        idempotencyKey: `stage:${episode.id}:${input.stage}:${input.linkId ?? "none"}`,
      });
      episode = result.episode;
      transitioned = true;
    } catch {
      // Invalid jump (e.g. skip) — keep current status; correlation id still returned.
      transitioned = false;
    }
  }

  return {
    episode,
    careEpisodeId: episode.id,
    stage: input.stage,
    transitioned,
    synthetic: true,
    ehrWrite: false,
  };
}

/** Resolve care episode id from request body / query without creating. */
export function readCareEpisodeId(source: {
  careEpisodeId?: string | null;
  care_episode_id?: string | null;
}): string | undefined {
  const raw = source.careEpisodeId ?? source.care_episode_id;
  const trimmed = raw?.trim();
  return trimmed || undefined;
}
