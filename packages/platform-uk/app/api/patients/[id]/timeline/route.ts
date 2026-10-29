import { NextResponse } from "next/server";

import { listDecisionHistory } from "@/lib/diabetes-intelligence/continuous-care-repository";
import { listJourneyEvents } from "@/lib/diabetes-intelligence/repository";
import { getPatientById } from "@/lib/mock-data";
import { buildPatientTimeline, type PatientTimelineEvent } from "@/lib/precision-health/timeline";
import { listConsentGrants } from "@/lib/repositories/consent-grant-repository";
import { listLearningEvents } from "@/lib/repositories/learning-event-repository";
import { listModalitySamples } from "@/lib/repositories/modality-sample-repository";
import { getReviewCaseRepositoryAdapter } from "@/lib/storage/get-review-case-repository-adapter";
import { DEFAULT_PRACTICE_ID } from "@/lib/repositories/constants";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const patientId = (await context.params).id?.trim();
  if (!patientId) {
    return NextResponse.json({ error: "patient id required" }, { status: 400 });
  }

  const patient = getPatientById(patientId);
  const adapter = getReviewCaseRepositoryAdapter();
  const cases = await adapter.readReviewCases(auth.context.scopeKey, DEFAULT_PRACTICE_ID);
  const scopeKey = auth.context.scopeKey;

  const [modalitySamples, consentGrants, learning, journeyEvents, continuousHistory] =
    await Promise.all([
      listModalitySamples({ scopeKey, patientId }),
      listConsentGrants({ scopeKey, patientId, includeRevoked: true }),
      listLearningEvents({ scopeKey, limit: 100 }),
      listJourneyEvents(patientId, { scopeKey }).catch(() => []),
      listDecisionHistory(patientId, { scopeKey }).catch(() => []),
    ]);

  const extraEvents: PatientTimelineEvent[] = [
    ...journeyEvents.map((e) => ({
      id: e.id,
      patientId,
      kind: "care_journey" as const,
      occurredAt: e.occurredAt,
      title: e.title,
      summary: e.summary,
      source: "diabetes_care_journey",
      ehrWrite: false as const,
      metadata: { kind: e.kind, ...(e.metadata ?? {}) },
    })),
    ...continuousHistory.map((h) => ({
      id: h.id,
      patientId,
      kind: "continuous_care" as const,
      occurredAt: h.createdAt,
      title: `Continuous care · ${h.subjectKind} · ${h.action}`,
      summary: h.reason ?? `${h.action} by ${h.actor}`,
      source: "continuous_care_operations",
      ehrWrite: false as const,
      metadata: {
        subjectKind: h.subjectKind,
        subjectId: h.subjectId,
        measurableOutcome: h.measurableOutcome,
      },
    })),
  ];

  const timeline = buildPatientTimeline({
    patientId,
    patientLabelHint: patient?.name,
    cases,
    modalitySamples,
    consentGrants,
    learningEvents: learning.events,
    extraEvents,
  });

  return NextResponse.json({
    ...timeline,
    patientLabel: patient?.name ?? patientId,
    ehrWrite: false,
    unifiedHealthRecord: false,
    journeyEventsMerged: journeyEvents.length,
    continuousCareEventsMerged: continuousHistory.length,
  });
}
