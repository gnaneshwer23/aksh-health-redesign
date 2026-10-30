/**
 * Milestone A3 — complete missing stakeholder handoffs on the care-episode spine.
 *
 * Extends existing care-episode + Front Desk paths (no new apps / orchestrators):
 * - nurse observations → GP review task
 * - GP clinical review → pharmacist medication-review task
 * - care-plan approval → patient visibility of APPROVED only
 * - follow-up ownership assignment
 * - lab / referral draft status tracking (HITL scope)
 */
import {
  addCareEpisodeTask,
  attachCareEpisodeLink,
  getCareEpisode,
} from "./repository";
import {
  correlateCareEpisodeStage,
  type CorrelateJourneyResult,
} from "./journey";
import type { CareEpisode, CareEpisodeTask } from "./types";
import type { CarePlanRecord, CareFollowUpTask } from "../diabetes-intelligence/types";
import type { ReviewCase, ReviewQueueItem, ReviewQueueItemStatus } from "../types";

export type HandoffResult = {
  careEpisodeId: string;
  task: CareEpisodeTask | null;
  created: boolean;
  synthetic: true;
  ehrWrite: false;
  autonomous: false;
};

function findOpenTask(
  episode: CareEpisode,
  ownerRole: string,
  titleIncludes: string
): CareEpisodeTask | undefined {
  return episode.tasks.find(
    (t) =>
      t.status === "open" &&
      t.ownerRole === ownerRole &&
      t.title.toLowerCase().includes(titleIncludes.toLowerCase())
  );
}

/**
 * T03 strengthen — after nurse vitals / observations, open a GP review task
 * on the same care_episode_id (idempotent).
 */
export async function handoffNurseToGp(input: {
  patientId: string;
  actor: string;
  scopeKey?: string;
  careEpisodeId?: string;
  vitalsSampleId?: string;
  summary?: string;
}): Promise<HandoffResult & { stage: CorrelateJourneyResult }> {
  const scopeKey = input.scopeKey ?? "shared";
  const stage = await correlateCareEpisodeStage({
    patientId: input.patientId,
    actor: input.actor,
    scopeKey,
    careEpisodeId: input.careEpisodeId,
    stage: "nurse_observations",
    linkId: input.vitalsSampleId ?? `vitals-${input.patientId}`,
    linkLabel: "Nurse vitals → GP",
  });

  const episode = await getCareEpisode(stage.careEpisodeId, scopeKey);
  if (!episode) {
    return {
      careEpisodeId: stage.careEpisodeId,
      task: null,
      created: false,
      stage,
      synthetic: true,
      ehrWrite: false,
      autonomous: false,
    };
  }

  const existing = findOpenTask(episode, "gp", "nurse observations");
  if (existing) {
    return {
      careEpisodeId: stage.careEpisodeId,
      task: existing,
      created: false,
      stage,
      synthetic: true,
      ehrWrite: false,
      autonomous: false,
    };
  }

  const title =
    input.summary?.trim() ||
    `GP review after nurse observations · episode ${stage.careEpisodeId}`;
  const updated = await addCareEpisodeTask(
    stage.careEpisodeId,
    {
      title,
      ownerRole: "gp",
      relatedLink: {
        kind: "patient_encounter",
        id: input.vitalsSampleId ?? `vitals-${input.patientId}`,
        label: "Nurse → GP handoff",
        linkedAt: new Date().toISOString(),
      },
    },
    input.actor,
    scopeKey
  );
  const task = updated.tasks[updated.tasks.length - 1] ?? null;
  return {
    careEpisodeId: stage.careEpisodeId,
    task,
    created: true,
    stage,
    synthetic: true,
    ehrWrite: false,
    autonomous: false,
  };
}

/**
 * T07 strengthen — after GP clinical review, open pharmacist med-review task
 * (HITL only; never auto-prescribe).
 */
export async function handoffGpToPharmacist(input: {
  patientId: string;
  actor: string;
  scopeKey?: string;
  careEpisodeId?: string;
  reviewCaseId?: string;
  summary?: string;
}): Promise<HandoffResult> {
  const scopeKey = input.scopeKey ?? "shared";
  const stage = await correlateCareEpisodeStage({
    patientId: input.patientId,
    actor: input.actor,
    scopeKey,
    careEpisodeId: input.careEpisodeId,
    stage: "clinical_review",
    linkId: input.reviewCaseId ?? `review-${input.patientId}`,
    linkLabel: "GP → pharmacist",
  });

  const episode = await getCareEpisode(stage.careEpisodeId, scopeKey);
  if (!episode) {
    return {
      careEpisodeId: stage.careEpisodeId,
      task: null,
      created: false,
      synthetic: true,
      ehrWrite: false,
      autonomous: false,
    };
  }

  const existing = findOpenTask(episode, "pharmacist", "medication review");
  if (existing) {
    return {
      careEpisodeId: stage.careEpisodeId,
      task: existing,
      created: false,
      synthetic: true,
      ehrWrite: false,
      autonomous: false,
    };
  }

  await attachCareEpisodeLink(
    stage.careEpisodeId,
    {
      kind: "medication_review",
      id: input.reviewCaseId ?? `medrev-${input.patientId}`,
      label: "Pharmacist medication review task",
    },
    input.actor,
    scopeKey
  ).catch(() => undefined);

  const title =
    input.summary?.trim() ||
    `Pharmacist medication review (HITL) · episode ${stage.careEpisodeId}`;
  const updated = await addCareEpisodeTask(
    stage.careEpisodeId,
    {
      title,
      ownerRole: "pharmacist",
      relatedLink: {
        kind: "medication_review",
        id: input.reviewCaseId ?? `medrev-${input.patientId}`,
        label: "GP → pharmacist handoff",
        linkedAt: new Date().toISOString(),
      },
    },
    input.actor,
    scopeKey
  );
  const task = updated.tasks[updated.tasks.length - 1] ?? null;
  return {
    careEpisodeId: stage.careEpisodeId,
    task,
    created: true,
    synthetic: true,
    ehrWrite: false,
    autonomous: false,
  };
}

/** Patient-facing care plans: APPROVED only (never DRAFT / REJECTED). */
export function filterPatientVisibleCarePlans(plans: CarePlanRecord[]): CarePlanRecord[] {
  return plans.filter((p) => p.status === "APPROVED");
}

export type PatientVisibleCarePlan = {
  id: string;
  patientId: string;
  title: string;
  status: "APPROVED";
  version: number;
  decidedAt: string | null;
  sections: { id: string; title: string; items: string[]; clinical: boolean }[];
  synthetic: true;
  ehrWrite: false;
  /** Explicit: drafts never leak to patient surface. */
  draftsHidden: true;
};

export function toPatientVisibleCarePlans(plans: CarePlanRecord[]): PatientVisibleCarePlan[] {
  return filterPatientVisibleCarePlans(plans).map((p) => ({
    id: p.id,
    patientId: p.patientId,
    title: `Care plan v${p.version}`,
    status: "APPROVED" as const,
    version: p.version,
    decidedAt: p.decidedAt,
    sections: p.sections.map((s) => ({
      id: s.id,
      title: s.title,
      items: [...s.items],
      clinical: s.clinical,
    })),
    synthetic: true,
    ehrWrite: false,
    draftsHidden: true,
  }));
}

/**
 * Follow-up ownership — assign / reassign owner on a journey follow-up task shape.
 * Does not invent clinical content; ownership only.
 */
export function assignFollowUpOwnership(
  task: CareFollowUpTask,
  input: {
    owner: string;
    actor: string;
    organisationId?: string | null;
  }
): CareFollowUpTask & {
  ownershipAudit: { at: string; actor: string; from: string; to: string };
} {
  const from = task.owner;
  const to = input.owner.trim();
  if (!to) throw new Error("Follow-up owner is required");
  if (input.organisationId && task.organisationId && task.organisationId !== input.organisationId) {
    throw new Error("Follow-up ownership denied: organisation boundary");
  }
  return {
    ...task,
    owner: to,
    organisationId: task.organisationId ?? input.organisationId ?? null,
    ownershipAudit: {
      at: new Date().toISOString(),
      actor: input.actor,
      from,
      to,
    },
  };
}

export type DraftTrackKind = "lab_order" | "referral_package";

export type DraftStatusSnapshot = {
  caseId: string;
  careEpisodeId: string | null;
  kind: DraftTrackKind;
  itemId: string;
  status: ReviewQueueItemStatus;
  stagedServiceRequest: boolean;
  ehrWrite: false;
  synthetic: true;
};

export function trackLabReferralDraftStatuses(reviewCase: ReviewCase): DraftStatusSnapshot[] {
  const items = reviewCase.reviewQueueItems ?? [];
  const out: DraftStatusSnapshot[] = [];
  for (const item of items) {
    if (item.itemType !== "lab_order" && item.itemType !== "referral_package") continue;
    const kind: DraftTrackKind =
      item.itemType === "lab_order" ? "lab_order" : "referral_package";
    const staged =
      kind === "lab_order"
        ? Boolean(reviewCase.labServiceRequestDrafts?.length)
        : Boolean(reviewCase.serviceRequestDraft);
    out.push({
      caseId: reviewCase.id,
      careEpisodeId: reviewCase.careEpisodeId ?? null,
      kind,
      itemId: item.id,
      status: item.status,
      stagedServiceRequest: staged,
      ehrWrite: false,
      synthetic: true,
    });
  }
  return out;
}

/** Advance tracked draft status after HITL (pure; caller persists ReviewCase). */
export function applyDraftStatusTransition(
  item: ReviewQueueItem,
  next: Extract<ReviewQueueItemStatus, "ACCEPTED" | "REJECTED">
): ReviewQueueItem {
  if (item.status !== "DRAFT") {
    throw new Error(`Cannot transition draft from ${item.status}`);
  }
  return { ...item, status: next };
}
