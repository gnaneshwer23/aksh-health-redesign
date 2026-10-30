/**
 * P0-UX-01 — Primary GP review worklist: persisted review cases (spine + diabetes adapter).
 * Domain agent-intel page remains prep; Accept/Edit/Reject happen on review-case items.
 */
import { NextResponse } from "next/server";

import { buildOpsRunVisibility } from "@/lib/agents/ops-run-visibility";
import { trackLabReferralDraftStatuses } from "@/lib/care-episode/stakeholder-handoffs";
import { resolveTenantContext } from "@/lib/db/tenant-context";
import { buildAgentIntelligenceWorklist } from "@/lib/diabetes-intelligence";
import { listReviewQueueAssignments } from "@/lib/gp/review-queue-assignment";
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
  const assignments = await listReviewQueueAssignments(auth.context.scopeKey, {
    practiceId: tenant.practiceId,
  });
  const assignmentByCase = new Map(assignments.map((a) => [a.caseId, a]));

  const primaryItems = openCases.flatMap((c) => {
    const drafts = resolveReviewQueueItems(c).filter((i) => i.status === "DRAFT");
    const assignment = assignmentByCase.get(c.id) ?? null;
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
      assigneeUserId: assignment?.assigneeUserId ?? null,
      assigneeRole: assignment?.assigneeRole ?? null,
      assignmentPriority: assignment?.priority ?? null,
      ehrWrite: false as const,
      synthetic: true as const,
    }));
  });

  const labReferralDrafts = openCases.flatMap((c) => trackLabReferralDraftStatuses(c));
  const opsVisibility = await buildOpsRunVisibility({
    scopeKey: auth.context.scopeKey,
    limit: 10,
    organisationId: tenant.practiceId ?? null,
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
    labReferralDraftStatuses: labReferralDrafts,
    assignmentsOpen: assignments.length,
    conductorOps: {
      total: opsVisibility.total,
      shieldBlockedCount: opsVisibility.shieldBlockedCount,
      runningCount: opsVisibility.runningCount,
      note: opsVisibility.note,
      phiLeakage: false as const,
    },
    practiceId: tenant.practiceId,
    synthetic: true,
    ehrWrite: false,
    hitlRequired: true,
    authoritativeDecisionSurface: "gp_review_queue",
    note:
      "Primary GP review is review-cases (spine CONDUCTOR + diabetes drafts enqueued via mayEnqueueAgentDraft). Domain agent-intelligence Accept/Edit/Reject is blocked — decide only on primary worklist items. A3: assignment + lab/referral draft status + PHI-safe CONDUCTOR ops strip.",
  });
}
