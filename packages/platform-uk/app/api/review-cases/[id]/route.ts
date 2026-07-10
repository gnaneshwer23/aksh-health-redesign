import { NextResponse } from "next/server";

import { shouldSyncAcceptedCaseToMedplum } from "@/lib/integration-config";
import { resolveTenantContext } from "@/lib/db/tenant-context";
import { attachPracticeIdToCase } from "@/lib/db/tenant-context";
import { readReviewCaseById, readReviewCases, updateReviewCase } from "@/lib/review-case-repository";
import { buildEvidencePayload, normalizeReviewCaseForPersistence } from "@/lib/workflow";
import { pushToMedplum } from "@/lib/medplum-client";
import type { ReviewCase } from "@/lib/types";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuthenticatedUserScope();
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
  const auth = await requireAuthenticatedUserScope();
  if (auth.response) return auth.response;

  const { scopeKey, userId } = auth.context;
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

  const normalized = attachPracticeIdToCase(normalizeReviewCaseForPersistence(payload), tenant.practiceId);
  normalized.userId = userId;
  const updated = await updateReviewCase(normalized, scopeKey, userId, tenant.practiceId);

  // If the user just clicked "Accept", the status transitioned from pending to accepted
  if (shouldSyncAcceptedCaseToMedplum(existing, payload, updated)) {
    if (updated.frozenArtifact && updated.frozenArtifact.exportedResources) {
      // Background push to Medplum
      pushToMedplum(updated.frozenArtifact.exportedResources).catch(err => {
        console.error("Non-blocking error: Failed to push to Medplum", err);
      });
    }
  }

  return NextResponse.json({ reviewCase: updated, evidence: buildEvidencePayload(updated) });
}
