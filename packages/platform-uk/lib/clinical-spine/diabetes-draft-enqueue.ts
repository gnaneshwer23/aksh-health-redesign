/**
 * P0-UX-01 — Adapter: diabetes agent-intel drafts → primary GP review-case worklist.
 *
 * Domain seed UI (`/dashboard/gp/agent-intelligence`) remains prep; clinician-facing
 * Accept/Edit/Reject for opted-in drafts persists on review cases (same HITL path as
 * CONDUCTOR spine enqueue). Guardian BLOCK is fail-closed via `mayEnqueueAgentDraft`.
 */
import { CLINICAL_AGENT_META } from "../agents";
import type { AgentIntelDraft, AgentIntelDraftKind } from "../diabetes-intelligence/agent-intel-types";
import { createReviewCase } from "../review-case-repository";
import type { ClinicalAgentId, ReviewCase, ReviewQueueItem, ReviewQueueItemType } from "../types";
import { mayEnqueueAgentDraft } from "../workflow/review-queue";
import { createReviewCaseFromIntake } from "../workflow/review";
import type { AgentEscalation } from "../agents/contracts/types";

export type DiabetesDraftEnqueueResult =
  | {
      enqueued: true;
      caseId: string;
      items: number;
      careEpisodeId?: string;
      reviewCase: ReviewCase;
    }
  | {
      enqueued: false;
      reason: string;
      careEpisodeId?: string;
    };

const KIND_MAP: Record<
  AgentIntelDraftKind,
  { itemType: ReviewQueueItemType; agentId: ClinicalAgentId }
> = {
  clinical_documentation: { itemType: "soap_note", agentId: "SYNTHESIS" },
  history_summary: { itemType: "soap_note", agentId: "SYNTHESIS" },
  missing_information: { itemType: "oracle_update", agentId: "ORACLE" },
  evidence_retrieval: { itemType: "oracle_update", agentId: "ORACLE" },
  follow_up_draft: { itemType: "referral_package", agentId: "REFERRAL" },
};

function draftContent(draft: AgentIntelDraft): string {
  const sections = draft.payload.sections?.map((s) => `${s.heading}: ${s.body}`).join("\n") ?? "";
  const soap = draft.payload.soap
    ? `S: ${draft.payload.soap.subjective}\nO: ${draft.payload.soap.objective}\nA: ${draft.payload.soap.assessment}\nP: ${draft.payload.soap.plan}`
    : "";
  return [soap, sections].filter(Boolean).join("\n\n") || draft.payload.title;
}

/** Pure mapping — does not persist. */
export function queueItemsFromDiabetesDrafts(
  caseId: string,
  drafts: AgentIntelDraft[]
): ReviewQueueItem[] {
  return drafts.map((draft) => {
    const mapped = KIND_MAP[draft.kind];
    return {
      id: `${caseId}-diab-${draft.id}`,
      agentId: mapped.agentId,
      itemType: mapped.itemType,
      status: "DRAFT" as const,
      title: draft.payload.title || `${draft.kind} draft`,
      summary: `Diabetes agent-intel · ${draft.kind} · provenance=${draft.provenance}`,
      content: draftContent(draft),
      metadata: {
        agent: CLINICAL_AGENT_META[mapped.agentId].label,
        provenance: "ai_draft",
        source: "diabetes_agent_intel",
        diabetesDraftId: draft.id,
        diabetesDraftKind: draft.kind,
        confidence: draft.confidence,
      },
    };
  });
}

export function buildDiabetesSpineReviewCase(input: {
  patientId: string;
  patientLabel: string;
  drafts: AgentIntelDraft[];
  userId: string;
  runId: string;
  careEpisodeId?: string;
  now?: Date;
}): ReviewCase {
  const now = input.now ?? new Date();
  const base = createReviewCaseFromIntake({
    patientLabel: input.patientLabel,
    rawInput: input.drafts.map((d) => d.payload.title).join("; ") || `Diabetes agent-intel for ${input.patientLabel}`,
    sourceType: "note",
  });
  const id = `diab-intel-${input.patientId.slice(0, 24)}-${now.getTime().toString(36)}`;
  return {
    ...base,
    id,
    version: 0,
    userId: input.userId,
    patientId: input.patientId,
    careEpisodeId: input.careEpisodeId,
    summary: `Diabetes agent-intel review · ${input.drafts.length} draft(s) · run ${input.runId}`,
    reviewQueueItems: queueItemsFromDiabetesDrafts(id, input.drafts),
    agentRun: {
      source: "diabetes_agent_intel",
      ranAt: now.toISOString(),
      queuePriority: "Normal",
      reviewOrder: [],
      safetyRoute: "proceed",
      ruleVersion: "diabetes-agent-intel-adapter",
      pendingReferrals: [],
      missingLabs: [],
      correlations: [],
      modelUsed: false,
    },
  };
}

/**
 * Persist diabetes drafts onto the primary GP review worklist when Guardian allows.
 * Idempotent per (scope, patient, runId) via deterministic case id prefix + metadata.
 */
export async function enqueueDiabetesDraftsToSpineReview(input: {
  patientId: string;
  patientLabel: string;
  drafts: AgentIntelDraft[];
  guardianOutputStatus: AgentEscalation | undefined;
  runId: string;
  userId: string;
  scopeKey: string;
  careEpisodeId?: string;
  practiceId?: string;
  nowMs?: number;
}): Promise<DiabetesDraftEnqueueResult> {
  if (!mayEnqueueAgentDraft(input.guardianOutputStatus)) {
    return {
      enqueued: false,
      reason: `Guardian BLOCK — diabetes drafts not enqueued to GP review (status=${input.guardianOutputStatus ?? "unavailable"})`,
      careEpisodeId: input.careEpisodeId,
    };
  }
  if (!input.drafts.length) {
    return {
      enqueued: false,
      reason: "No diabetes drafts to enqueue",
      careEpisodeId: input.careEpisodeId,
    };
  }

  const reviewCase = buildDiabetesSpineReviewCase({
    patientId: input.patientId,
    patientLabel: input.patientLabel,
    drafts: input.drafts,
    userId: input.userId,
    runId: input.runId,
    careEpisodeId: input.careEpisodeId,
    now: input.nowMs != null ? new Date(input.nowMs) : undefined,
  });

  const created = await createReviewCase(
    reviewCase,
    input.scopeKey,
    input.userId,
    input.practiceId
  );

  if (input.careEpisodeId) {
    try {
      const { attachCareEpisodeLink } = await import("../care-episode");
      await attachCareEpisodeLink(
        input.careEpisodeId,
        {
          kind: "review_case",
          id: created.id,
          label: "Diabetes agent-intel → GP review",
        },
        input.userId,
        input.scopeKey
      );
      await attachCareEpisodeLink(
        input.careEpisodeId,
        {
          kind: "agent_intel_run",
          id: input.runId,
          label: "Diabetes agent-intel assemble",
        },
        input.userId,
        input.scopeKey
      );
    } catch {
      // Episode link is best-effort correlation; review case already persisted.
    }
  }

  return {
    enqueued: true,
    caseId: created.id,
    items: created.reviewQueueItems?.length ?? 0,
    careEpisodeId: input.careEpisodeId,
    reviewCase: created,
  };
}

/**
 * Locate an open (pending_review + DRAFT item) review-case row for a diabetes draft.
 * Used to route clinicians to the primary HITL surface and to block domain decide APIs.
 */
export async function findOpenReviewItemForDiabetesDraft(input: {
  diabetesDraftId: string;
  scopeKey: string;
  practiceId?: string;
}): Promise<{ caseId: string; itemId: string; decisionHref: string } | null> {
  const { readReviewCases } = await import("../review-case-repository");
  const { resolveReviewQueueItems } = await import("../workflow/review-queue");
  const cases = await readReviewCases(input.scopeKey, input.practiceId);
  for (const c of cases) {
    if (c.status !== "pending_review") continue;
    for (const item of resolveReviewQueueItems(c)) {
      if (item.status !== "DRAFT") continue;
      if (item.metadata?.diabetesDraftId === input.diabetesDraftId) {
        return {
          caseId: c.id,
          itemId: item.id,
          decisionHref: `/review/${encodeURIComponent(c.id)}`,
        };
      }
    }
  }
  return null;
}
