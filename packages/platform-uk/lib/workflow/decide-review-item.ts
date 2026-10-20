/**
 * A clinician's decision on one review-queue draft, decided on the server (brief: an Accept/Edit/Reject must not
 * merely update a badge). Pure: validates the request against the stored case and returns the next case and the
 * audit entry to persist. The route persists both in one transaction, with a version check.
 */
import { CLINICAL_AGENT_META } from "../agents";
import type { ReviewCase } from "../types";

import { resolveReviewQueueItems, updateQueueItemDecision } from "./review-queue";

export type ItemDecisionAction = "accept" | "edit" | "reject";
export type ItemDecisionRequest = { action: ItemDecisionAction; expectedVersion: number; content?: string; reason?: string; offerHealthPlan?: boolean };

export class DecisionError extends Error {
  constructor(readonly code: "ITEM_NOT_FOUND" | "STALE_CASE" | "ALREADY_DECIDED" | "REASON_REQUIRED" | "CONTENT_REQUIRED" | "INVALID", readonly status: 400 | 404 | 409, message: string) {
    super(`${code}: ${message}`);
  }
}

const STATUS = { accept: "ACCEPTED", reject: "REJECTED", edit: "DRAFT" } as const;

export function parseItemDecision(body: unknown): ItemDecisionRequest {
  const b = (body ?? {}) as Record<string, unknown>;
  const action = b.action;
  if (action !== "accept" && action !== "edit" && action !== "reject") throw new DecisionError("INVALID", 400, "action must be accept, edit or reject");
  const expectedVersion = Number(b.expectedVersion);
  if (!Number.isInteger(expectedVersion) || expectedVersion < 0) throw new DecisionError("INVALID", 400, "expectedVersion is required");
  const content = typeof b.content === "string" ? b.content : undefined;
  const reason = typeof b.reason === "string" ? b.reason : undefined;
  if (content && content.length > 20_000) throw new DecisionError("INVALID", 400, "edited text is too long");
  if (reason && reason.length > 1_000) throw new DecisionError("INVALID", 400, "reason is too long");
  return { action, expectedVersion, content, reason, offerHealthPlan: b.offerHealthPlan === true && action === "accept" };
}

export function decideReviewItem(existing: ReviewCase, itemId: string, req: ItemDecisionRequest, actor: string) {
  const current = existing.version ?? 0;
  if (req.expectedVersion !== current) {
    throw new DecisionError("STALE_CASE", 409, "the case changed since you opened it; reload to see the latest version");
  }
  const item = resolveReviewQueueItems(existing).find((i) => i.id === itemId);
  if (!item) throw new DecisionError("ITEM_NOT_FOUND", 404, "no such draft on this case");
  if (item.status !== "DRAFT") throw new DecisionError("ALREADY_DECIDED", 409, `this draft was already ${item.status.toLowerCase()} by ${item.decidedBy ?? "a reviewer"}`);
  if (req.action === "reject" && (req.reason?.trim().length ?? 0) < 3) throw new DecisionError("REASON_REQUIRED", 400, "a reason is required to reject");
  if (req.action === "edit" && !req.content?.trim()) throw new DecisionError("CONTENT_REQUIRED", 400, "edited text is required");

  let next = updateQueueItemDecision(existing, itemId, STATUS[req.action], {
    decidedBy: actor,
    rejectionReason: req.reason?.trim(),
    content: req.action === "edit" ? req.content!.trim() : undefined,
  });
  // Keep the generated text when a clinician edits it, so the original and the edit can both be seen.
  if (req.action === "edit") {
    next = {
      ...next,
      reviewQueueItems: resolveReviewQueueItems(next).map((i) => (i.id === itemId && i.originalContent === undefined ? { ...i, originalContent: item.content ?? "" } : i)),
    };
  }
  next = { ...next, version: current + 1 };
  const decided = resolveReviewQueueItems(next).find((i) => i.id === itemId)!;
  return {
    next,
    outcome: { itemId, action: req.action, status: decided.status, decidedBy: actor, decidedAt: decided.decidedAt ?? null, version: current + 1 },
    audit: {
      action: req.action,
      actor,
      label: `${item.title} → ${STATUS[req.action]}${req.action === "edit" ? " (edited)" : ""}`,
      detail: req.action === "reject" ? `Reason: ${req.reason!.trim()}` : undefined,
      category: "reviewer_decision",
      caseId: existing.id,
      practiceId: existing.practiceId ?? null,
      queueItemId: itemId,
      agentLabel: CLINICAL_AGENT_META[item.agentId]?.label ?? null,
      resourceRef: `${item.title} → ${STATUS[req.action]}`,
      payload: { fromVersion: current, toVersion: current + 1 },
    },
  };
}
