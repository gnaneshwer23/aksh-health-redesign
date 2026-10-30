/**
 * Clinical spine: every GP Accept / Edit / Reject writes
 * SHIELD (already on case via updateQueueItemDecision) + learning event (prediction→decision)
 * which surfaces on the patient timeline. Optional health-plan draft after Accept (HITL, ehrWrite:false).
 */

import { CLINICAL_AGENT_META } from "@/lib/agents";
import {
  FLAGSHIP_CANONICAL_PATIENT_ID,
  resolveCanonicalPatientId,
} from "@/lib/e2e/patient-identity";
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
  /** True when the SHIELD durable audit mirror failed for at least one decision (OQ-HITL-2). */
  shieldAuditWriteFailed: boolean;
  /** Learning event ids whose SHIELD dual write failed — retryable via /api/clinical-spine/shield-audit-retry. */
  failedShieldAuditLearningEventIds: string[];
};

const SCENARIO_COHORT: Record<string, string> = {
  "PATEL-DEMO": FLAGSHIP_CANONICAL_PATIENT_ID,
  "V-UK1": "synthetic-v-uk1"
};

const CASE_COHORT: Record<string, string> = {
  "case-patel-demo": FLAGSHIP_CANONICAL_PATIENT_ID,
  "case-v-uk1": "synthetic-v-uk1"
};

/** Map a review case onto the canonical cohort / synthetic patient id for timeline + learning. */
export function resolveSpinePatientId(reviewCase: ReviewCase): string {
  if (reviewCase.scenarioId && SCENARIO_COHORT[reviewCase.scenarioId]) {
    return SCENARIO_COHORT[reviewCase.scenarioId];
  }
  if (CASE_COHORT[reviewCase.id]) {
    return CASE_COHORT[reviewCase.id];
  }
  const fromLabel = reviewCase.patientLabel?.match(/\b(P\d{3}|E2P\d{3})\b/i);
  if (fromLabel) return resolveCanonicalPatientId(fromLabel[1].toUpperCase());
  const fromId = reviewCase.id.match(/\b(P\d{3}|E2P\d{3})\b/i);
  if (fromId) return resolveCanonicalPatientId(fromId[1].toUpperCase());
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
  const failedShieldAuditLearningEventIds: string[] = [];
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

    const { event, shieldAuditWriteFailed } = await recordLearningEvent(
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
    if (shieldAuditWriteFailed) {
      failedShieldAuditLearningEventIds.push(event.id);
    }
  }

  // Mirror diabetes agent-intel draft status when the primary review item is decided.
  // Accept/reject only — edit requires editedPayload on the domain path and is left to prep UI.
  for (const delta of deltas) {
    if (delta.decision !== "accept" && delta.decision !== "reject") continue;
    const diabetesDraftId =
      typeof delta.item.metadata?.diabetesDraftId === "string"
        ? delta.item.metadata.diabetesDraftId
        : null;
    if (!diabetesDraftId) continue;
    try {
      const { decideAgentIntelDraft } = await import(
        "../diabetes-intelligence/agent-intel-repository"
      );
      const patientIdForDraft =
        options.next.patientId?.trim() ||
        resolveSpinePatientId(options.next);
      await decideAgentIntelDraft(
        {
          patientId: patientIdForDraft,
          draftId: diabetesDraftId,
          action: delta.decision,
          actor:
            options.actor?.trim() ||
            delta.item.decidedBy?.trim() ||
            "clinician",
          reason:
            delta.decision === "reject"
              ? delta.item.rejectionReason ?? "Rejected on primary GP review"
              : `Mirrored from primary review case ${options.next.id}`,
        },
        { scopeKey: options.scopeKey }
      );
    } catch {
      // Domain mirror is best-effort; primary review-case decision + SHIELD already committed.
    }
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
    autoRetrain: false,
    shieldAuditWriteFailed: failedShieldAuditLearningEventIds.length > 0,
    failedShieldAuditLearningEventIds
  };
}

export type { HealthPlanDraft };
