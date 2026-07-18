import { NextResponse } from "next/server";

import { getPatientById } from "@/lib/mock-data";
import { buildPatientTimeline } from "@/lib/precision-health/timeline";
import { listConsentGrants } from "@/lib/repositories/consent-grant-repository";
import { listLearningEvents } from "@/lib/repositories/learning-event-repository";
import { listModalitySamples } from "@/lib/repositories/modality-sample-repository";
import { getReviewCaseRepositoryAdapter } from "@/lib/storage/get-review-case-repository-adapter";
import { DEFAULT_PRACTICE_ID } from "@/lib/repositories/constants";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

type RouteContext = { params: { id: string } };

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const patientId = context.params.id?.trim();
  if (!patientId) {
    return NextResponse.json({ error: "patient id required" }, { status: 400 });
  }

  const patient = getPatientById(patientId);
  const adapter = getReviewCaseRepositoryAdapter();
  const cases = await adapter.readReviewCases(auth.context.scopeKey, DEFAULT_PRACTICE_ID);

  const [modalitySamples, consentGrants, learning] = await Promise.all([
    listModalitySamples({ scopeKey: auth.context.scopeKey, patientId }),
    listConsentGrants({ scopeKey: auth.context.scopeKey, patientId, includeRevoked: true }),
    listLearningEvents({ scopeKey: auth.context.scopeKey, limit: 100 })
  ]);

  const timeline = buildPatientTimeline({
    patientId,
    patientLabelHint: patient?.name,
    cases,
    modalitySamples,
    consentGrants,
    learningEvents: learning.events
  });

  return NextResponse.json({
    ...timeline,
    patientLabel: patient?.name ?? patientId,
    ehrWrite: false,
    unifiedHealthRecord: false
  });
}
