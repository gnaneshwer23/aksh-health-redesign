import { deriveReviewQueueItems, CLINICAL_AGENT_META } from "../agents";
import { applyReferralAccept, maybeStageReferralPackage } from "../referral-agent";
import {
  createShieldAuditEvent,
  applyQueueItemStatus,
  appendShieldAudit,
  scheduleDurableShieldWrite
} from "../shield-audit";
import { formatCaseTimestamp } from "../time-format";
import type { ReviewCase, ReviewQueueItem, ReviewQueueItemStatus } from "../types";

export { deriveReviewQueueItems, deriveAgentCards, deriveActiveAgents } from "../agents";

export function resolveReviewQueueItems(reviewCase: ReviewCase): ReviewQueueItem[] {
  return deriveReviewQueueItems(reviewCase);
}

export function countDraftQueueItems(reviewCase: ReviewCase) {
  return resolveReviewQueueItems(reviewCase).filter((item) => item.status === "DRAFT").length;
}

export function updateQueueItemDecision(
  reviewCase: ReviewCase,
  itemId: string,
  status: ReviewQueueItemStatus,
  options: { decidedBy: string; rejectionReason?: string; content?: string }
): ReviewCase {
  const currentItems = resolveReviewQueueItems(reviewCase);
  const target = currentItems.find((item) => item.id === itemId);

  if (!target) {
    return reviewCase;
  }

  const nextItems = applyQueueItemStatus(currentItems, itemId, status, options);
  const shieldAction = status === "ACCEPTED" ? "accept" : status === "REJECTED" ? "reject" : "edit";
  const shieldEvent = createShieldAuditEvent({
    action: shieldAction,
    actor: options.decidedBy,
    detail: `${target.title} → ${status}`,
    queueItemId: itemId,
    agentLabel: CLINICAL_AGENT_META[target.agentId].label
  });

  let nextCase: ReviewCase = appendShieldAudit(
    {
      ...reviewCase,
      reviewQueueItems: nextItems,
      updatedAt: formatCaseTimestamp()
    },
    shieldEvent
  );

  scheduleDurableShieldWrite({
    action: shieldAction,
    actor: options.decidedBy,
    event: shieldEvent,
    caseId: reviewCase.id,
    practiceId: reviewCase.practiceId,
    queueItemId: itemId,
    agentLabel: CLINICAL_AGENT_META[target.agentId].label,
    resourceRef: `${target.title} → ${status}`
  });

  nextCase = maybeStageReferralPackage(nextCase, resolveReviewQueueItems(nextCase));

  if (target.itemType === "referral_package" && status === "ACCEPTED") {
    nextCase = applyReferralAccept(nextCase);
  }

  return nextCase;
}
