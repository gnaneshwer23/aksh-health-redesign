/**
 * Clinical spine: every GP Accept / Edit / Reject writes
 * SHIELD (already on case via updateQueueItemDecision) + learning event (prediction→decision)
 * which surfaces on the patient timeline. Optional health-plan draft after Accept (HITL, ehrWrite:false).
 */

import { CLINICAL_AGENT_META } from "@/lib/agents";
import type { LearningDecision } from "@/lib/clinical-proof/learning-loop";
import { createHealthPlanDraft } from "@/lib/repositories/health-plan-repository";
import { recordLearningEvent } from "@/lib/repositories/learning-event-repository";
import type { HealthPlanDraft } from "@/lib/precision-health/health-plan";
import type { ReviewCase, ReviewQueueItem, ReviewQueueItemStatus } from "@/lib/types";
import { resolveReviewQueueItems } from "@/lib/workflow/review-queue";

export type QueueDecisionDelta = {
  item: ReviewQueueItem;
  previousStatus: ReviewQueueItemStatus;
  nextStatus: ReviewQueueItemStatus;
  decision: LearningDecision;
};

export type SpineDecisionResult = {
  patientId: string;
  learningEventIds: string[];
  healthPlanId: string | null;
  ehrWrite: false;
  autoRetrain: false;
};

const SCENARIO_COHORT: Record<string, string> = {
  "PATEL-DEMO": "P002",
  "V-UK1": "synthetic-v-uk1"
};

const CASE_COHORT: Record<string, string> = {
  "case-patel-demo": "P002",
  "case-v-uk1": "synthetic-v-uk1"
};

/** Map a review case onto a cohort / synthetic patient id for timeline + learning. */
export function resolveSpinePatientId(reviewCase: ReviewCase): string {
  if (reviewCase.scenarioId && SCENARIO_COHORT[reviewCase.scenarioId]) {
    return SCENARIO_COHORT[reviewCase.scenarioId];
  }
  if (CASE_COHORT[reviewCase.id]) {
    return CASE_COHORT[reviewCase.id];
  }
  const fromLabel = reviewCase.patientLabel?.match(/\b(P\d{3})\b/i);
  if (fromLabel) return fromLabel[1].toUpperCase();
  const fromId = reviewCase.id.match(/\b(P\d{3})\b/i);
  if (fromId) return fromId[1].toUpperCase();
  return `case-${reviewCase.id}`;
}

function statusToDecision(status: ReviewQueueItemStatus): LearningDecision | null {
  if (status === "ACCEPTED") return "accept";
  if (status === "REJECTED") return "reject";
  // Edit path keeps DRAFT but marks decidedBy — treat as edit when previously DRAFT with no decision
  return null;
}

/**
 * Diff queue items between existing and next case to find new clinician decisions.
 * Edit is detected when status stays DRAFT but decidedBy/content/decidedAt changed.
 */
export function diffQueueDecisions(
  existing: ReviewCase,
  next: ReviewCase
): QueueDecisionDelta[] {
  const prevItems = resolveReviewQueueItems(existing);
  const nextItems = resolveReviewQueueItems(next);
  const prevById = new Map(prevItems.map((item) => [item.id, item]));
  const deltas: QueueDecisionDelta[] = [];

  for (const item of nextItems) {
    const prev = prevById.get(item.id);
    if (!prev) continue;

    if (prev.status !== item.status && (item.status === "ACCEPTED" || item.status === "REJECTED")) {
      const decision = statusToDecision(item.status);
      if (!decision) continue;
      deltas.push({
        item,
        previousStatus: prev.status,
        nextStatus: item.status,
        decision
      });
      continue;
    }

    const edited =
      item.status === "DRAFT" &&
      Boolean(item.decidedBy) &&
      (prev.content !== item.content ||
        prev.decidedBy !== item.decidedBy ||
        prev.decidedAt !== item.decidedAt ||
        prev.summary !== item.summary);

    if (edited) {
      deltas.push({
        item,
        previousStatus: prev.status,
        nextStatus: item.status,
        decision: "edit"
      });
    }
  }

  return deltas;
}

export async function recordSpineQueueDecisions(options: {
  existing: ReviewCase;
  next: ReviewCase;
  scopeKey: string;
  actor?: string;
  /** When true and at least one Accept occurred, draft a personalised health plan (HITL). */
  offerHealthPlan?: boolean;
}): Promise<SpineDecisionResult> {
  const deltas = diffQueueDecisions(options.existing, options.next);
  const patientId = resolveSpinePatientId(options.next);
  const learningEventIds: string[] = [];
  let healthPlanId: string | null = null;

  for (const delta of deltas) {
    const actor =
      options.actor?.trim() ||
      delta.item.decidedBy?.trim() ||
      "clinician";
    const agentLabel =
      CLINICAL_AGENT_META[delta.item.agentId]?.label ?? delta.item.agentId;
    const predictionSummary =
      delta.item.summary || delta.item.title || delta.item.content?.slice(0, 200);

    const { event } = await recordLearningEvent(
      {
        patientId,
        caseId: options.next.id,
        queueItemId: delta.item.id,
        practiceId: options.next.practiceId ?? null,
        agentLabel,
        predictionId: `pred-${delta.item.id}`,
        predictionSummary,
        decision: delta.decision,
        decisionActor: actor,
        decisionNotes:
          delta.decision === "reject"
            ? delta.item.rejectionReason ?? "Rejected by reviewer"
            : delta.decision === "edit"
              ? "Reviewer edited draft content (HITL)"
              : "Accepted by reviewer (HITL)",
        outcomeKind:
          delta.decision === "accept"
            ? "follow_up_scheduled"
            : delta.decision === "reject"
              ? "care_action_deferred"
              : "unknown"
      },
      { scopeKey: options.scopeKey, shieldDualWrite: true }
    );
    learningEventIds.push(event.id);
  }

  const accepted = deltas.some((d) => d.decision === "accept");
  if (options.offerHealthPlan && accepted) {
    const draft = await createHealthPlanDraft(
      {
        patientId,
        patientLabel: options.next.patientLabel,
        createdBy:
          options.actor?.trim() ||
          deltas.find((d) => d.decision === "accept")?.item.decidedBy ||
          "clinician",
        trigger: "hitl_accept",
        caseId: options.next.id,
        medications: options.next.safetyContext?.currentMedications,
        riskSignals: options.next.oracleRiskScore?.factors,
        conditions: options.next.oracleRiskScore?.factors?.slice(0, 2)
      },
      { scopeKey: options.scopeKey }
    );
    healthPlanId = draft.id;
  }

  return {
    patientId,
    learningEventIds,
    healthPlanId,
    ehrWrite: false,
    autoRetrain: false
  };
}

export type { HealthPlanDraft };
