/**
 * P0-UX-01 — Primary GP review worklist: persisted review cases (spine + diabetes adapter).
 * Domain agent-intel page remains prep; Accept/Edit/Reject happen on review-case items.
 */
import { NextResponse } from "next/server";

import { resolveTenantContext } from "@/lib/db/tenant-context";
import { buildAgentIntelligenceWorklist } from "@/lib/diabetes-intelligence";
import { readReviewCases } from "@/lib/review-case-repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";
import { resolveReviewQueueItems } from "@/lib/workflow/review-queue";

export const maxDuration = 30;

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const tenant = resolveTenantContext(request, auth.context);
  const cases = await readReviewCases(auth.context.scopeKey, tenant.practiceId);
  const openCases = cases.filter((c) => c.status === "pending_review");

  const primaryItems = openCases.flatMap((c) => {
    const drafts = resolveReviewQueueItems(c).filter((i) => i.status === "DRAFT");
    return drafts.map((item) => ({
      surface: "gp_review_queue" as const,
      caseId: c.id,
      patientId: c.patientId ?? null,
      patientLabel: c.patientLabel,
      careEpisodeId: c.careEpisodeId ?? null,
      itemId: item.id,
      title: item.title,
      summary: item.summary,
      itemType: item.itemType,
      agentId: item.agentId,
      source: c.agentRun?.source ?? "intake",
      diabetesDraftId:
        typeof item.metadata?.diabetesDraftId === "string" ? item.metadata.diabetesDraftId : null,
      decisionHref: `/review/${encodeURIComponent(c.id)}`,
      ehrWrite: false as const,
      synthetic: true as const,
    }));
  });

  // Prep-only domain drafts (not yet / also mirrored) — linked, not a second decision surface.
  const domainPrep = await buildAgentIntelligenceWorklist({
    scopeKey: auth.context.scopeKey,
  });
  const enqueuedDiabetesIds = new Set(
    primaryItems.map((i) => i.diabetesDraftId).filter((x): x is string => Boolean(x))
  );
  const prepOnly = domainPrep
    .filter((d) => !enqueuedDiabetesIds.has(d.id))
    .map((d) => ({
      surface: "agent_intel_prep" as const,
      caseId: null,
      patientId: d.patientId,
      patientLabel: d.patientLabel,
      careEpisodeId: null as string | null,
      itemId: d.id,
      title: d.title,
      summary: `${d.kind} · prep only — open primary review queue after assemble enqueue`,
      itemType: d.kind,
      agentId: "DIABETES_AGENT_INTEL",
      source: "diabetes_agent_intel_prep" as const,
      diabetesDraftId: d.id,
      decisionHref: `/dashboard/gp/review-queue?patient=${encodeURIComponent(d.patientId)}`,
      ehrWrite: false as const,
      synthetic: true as const,
    }));

  return NextResponse.json({
    primaryWorklist: primaryItems,
    prepOnlyNotInPrimary: prepOnly,
    primaryCount: primaryItems.length,
    prepCount: prepOnly.length,
    practiceId: tenant.practiceId,
    synthetic: true,
    ehrWrite: false,
    hitlRequired: true,
    authoritativeDecisionSurface: "gp_review_queue",
    note:
      "Primary GP review is review-cases (spine CONDUCTOR + diabetes drafts enqueued via mayEnqueueAgentDraft). Domain agent-intelligence Accept/Edit/Reject is blocked — decide only on primary worklist items.",
  });
}
