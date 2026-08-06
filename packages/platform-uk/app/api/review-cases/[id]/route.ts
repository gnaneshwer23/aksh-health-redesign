import { NextResponse } from "next/server";

import { stageAcceptedCaseToBridge } from "@/lib/bridge-staging";
import { recordSpineQueueDecisions } from "@/lib/clinical-spine/queue-decision";
import { shouldSyncAcceptedCaseToMedplum } from "@/lib/integration-config";
import { resolveTenantContext } from "@/lib/db/tenant-context";
import { attachPracticeIdToCase } from "@/lib/db/tenant-context";
import { readReviewCaseById, readReviewCases, updateReviewCase } from "@/lib/review-case-repository";
import { buildEvidencePayload, normalizeReviewCaseForPersistence } from "@/lib/workflow";
import { pushToMedplum } from "@/lib/medplum-client";
import type { ReviewCase } from "@/lib/types";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response) return auth.response;

  const { scopeKey, userId } = auth.context;
  const tenant = resolveTenantContext(request, auth.context);
  const reviewCase = await readReviewCaseById(params.id, scopeKey, userId, tenant.practiceId);

  if (!reviewCase) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  return NextResponse.json({ reviewCase, evidence: buildEvidencePayload(reviewCase) });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response) return auth.response;

  const { scopeKey, userId, userRole } = auth.context;

  // FR-PER-009 / OQ-PER-1/2: this route records a clinical Accept/Edit/Reject disposition.
  // Only the clinical_reviewer AppRole may do so — patient, researcher, operations_lead, and
  // any other/unrecognized ("restricted") AppRole must never be able to record one, even for
  // a case they otherwise "own" by scopeKey.
  if (userRole !== "clinical_reviewer") {
    return NextResponse.json(
      { error: "Forbidden. Only the clinical reviewer role may record an Accept/Edit/Reject decision." },
      { status: 403 }
    );
  }

  const tenant = resolveTenantContext(request, auth.context);
  const payload = (await request.json()) as ReviewCase;
  const cases = await readReviewCases(scopeKey, tenant.practiceId);
  const existing = cases.find((item) => item.id === params.id);

  if (!existing) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  // Ownership validation
  if (existing.userId && existing.userId !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const offerHealthPlan =
    (payload as ReviewCase & { offerHealthPlan?: boolean }).offerHealthPlan === true;

  // Strip client-only spine flags before persistence
  const { offerHealthPlan: _omitOffer, ...persistable } = payload as ReviewCase & {
    offerHealthPlan?: boolean;
  };
  void _omitOffer;

  const normalized = attachPracticeIdToCase(
    normalizeReviewCaseForPersistence(persistable),
    tenant.practiceId
  );
  normalized.userId = userId;
  const updated = await updateReviewCase(normalized, scopeKey, userId, tenant.practiceId);

  // Clinical spine: SHIELD is already on the case via updateQueueItemDecision;
  // dual-write learning (+ optional health-plan draft) so timeline matches decisions.
  let spine: Awaited<ReturnType<typeof recordSpineQueueDecisions>> | null = null;
  try {
    spine = await recordSpineQueueDecisions({
      existing,
      next: updated,
      scopeKey,
      actor: auth.context.userEmail ?? userId,
      offerHealthPlan
    });
  } catch (spineError) {
    console.error("[clinical-spine] queue decision record failed", spineError);
  }

  // D1-a: HITL Accept → BRIDGE FHIR-in-Neon/file staging + emis-staging + sim write-back.
  // Never live EMIS; Medplum not required.
  let bridgeStaging: Awaited<ReturnType<typeof stageAcceptedCaseToBridge>> | null = null;
  const newlyAccepted = existing.status !== "accepted" && updated.status === "accepted";
  if (newlyAccepted) {
    try {
      bridgeStaging = await stageAcceptedCaseToBridge({
        caseId: updated.id,
        acceptedBy: auth.context.userEmail ?? userId,
        clinicianId: userId,
        practiceId: tenant.practiceId,
        scopeKey,
        reviewCase: updated,
        runSimWriteback: true
      });
    } catch (bridgeError) {
      console.error("[bridge-staging] Accept staging failed (non-blocking)", bridgeError);
    }
  }

  // Medplum rehearsal only when ENABLE_MEDPLUM_SYNC=true + newly accepted frozen case.
  // Non-blocking; never EMIS; pushToMedplum refuses when flag is off.
  if (shouldSyncAcceptedCaseToMedplum(existing, payload, updated)) {
    if (updated.frozenArtifact && updated.frozenArtifact.exportedResources) {
      void pushToMedplum(updated.frozenArtifact.exportedResources).then((result) => {
        if (!result.ok) {
          console.error("[medplum] Non-blocking rehearsal push failed:", result.error);
        }
      });
    }
  }

  return NextResponse.json({
    reviewCase: updated,
    evidence: buildEvidencePayload(updated),
    spine: spine
      ? {
          patientId: spine.patientId,
          learningEventIds: spine.learningEventIds,
          healthPlanId: spine.healthPlanId,
          ehrWrite: false as const,
          autoRetrain: false as const,
          // OQ-HITL-2: honest flag — Accept/Edit/Reject above still completed (HTTP 200);
          // this only reports that the SHIELD durable audit mirror failed for it.
          shieldAuditWriteFailed: spine.shieldAuditWriteFailed,
          failedShieldAuditLearningEventIds: spine.failedShieldAuditLearningEventIds
        }
      : null,
    bridgeStaging: bridgeStaging
      ? {
          id: bridgeStaging.bridgeRecord.id,
          status: bridgeStaging.status,
          storage: bridgeStaging.bridgeRecord.storage,
          fhirResourceCount: bridgeStaging.fhirResourceCount,
          emisStagingEntryId: bridgeStaging.emisStagingEntryId,
          simWriteId: bridgeStaging.simWriteId,
          liveEmis: false as const,
          medplumRequired: false as const,
          fhirExportPath: `/api/review-cases/${updated.id}/export/fhir`
        }
      : null
  });
}
