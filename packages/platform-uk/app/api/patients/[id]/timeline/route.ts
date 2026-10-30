import { NextResponse } from "next/server";

import { denyUnlessConnectedPatientAccess } from "@/lib/clinical-proof/connected-patient-access";
import { listHistory as listAgentHistory } from "@/lib/diabetes-intelligence/agent-intel-repository";
import { listDecisionHistory } from "@/lib/diabetes-intelligence/continuous-care-repository";
import { listGlucoseReviews, listGlucoseSeries } from "@/lib/diabetes-intelligence/glucose-repository";
import { listApprovalHistory } from "@/lib/diabetes-intelligence/medcare-repository";
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

  const denied = denyUnlessConnectedPatientAccess(auth.context, patientId);
  if (denied) return denied;

  const patient = getPatientById(patientId);
  const adapter = getReviewCaseRepositoryAdapter();
  const cases = await adapter.readReviewCases(auth.context.scopeKey, DEFAULT_PRACTICE_ID);
  const scopeKey = auth.context.scopeKey;

  const [
    modalitySamples,
    consentGrants,
    learning,
    journeyEvents,
    continuousHistory,
    glucoseReviews,
    glucoseSeries,
    medcareHistory,
    agentHistory,
  ] = await Promise.all([
    listModalitySamples({ scopeKey, patientId }),
    listConsentGrants({ scopeKey, patientId, includeRevoked: true }),
    listLearningEvents({ scopeKey, limit: 100 }),
    listJourneyEvents(patientId, { scopeKey }).catch(() => []),
    listDecisionHistory(patientId, { scopeKey }).catch(() => []),
    listGlucoseReviews(patientId, { scopeKey }).catch(() => []),
    listGlucoseSeries(patientId, { scopeKey }).catch(() => []),
    listApprovalHistory(patientId, { scopeKey }).catch(() => []),
    listAgentHistory(patientId, { scopeKey }).catch(() => []),
  ]);

  const glucoseSeriesEvents: PatientTimelineEvent[] = glucoseSeries.slice(-12).map((r) => ({
    id: `glu-series-${r.id}`,
    patientId,
    kind: "glucose_intelligence" as const,
    occurredAt: r.recordedAt,
    title: `Glucose · ${r.channel}`,
    summary: `${r.valueNumeric} ${r.unit}${r.context ? ` (${r.context})` : ""} · ${r.sourceSystem}`,
    source: "glucose_series_readings",
    ehrWrite: false as const,
    metadata: {
      channel: r.channel,
      qualityFlag: r.qualityFlag,
      canonicalStore: true,
    },
  }));

  const glucoseReviewEvents: PatientTimelineEvent[] = glucoseReviews.map((r) => ({
    id: `glu-review-${r.id}`,
    patientId,
    kind: "glucose_intelligence" as const,
    occurredAt: r.decidedAt ?? r.createdAt,
    title: `Glucose review · ${r.status}`,
    summary: `HITL ${r.status}${r.decidedBy ? ` by ${r.decidedBy}` : ""}`,
    source: "diabetes_glucose_intelligence",
    ehrWrite: false as const,
    metadata: { reviewId: r.id, status: r.status },
  }));

  const medcareEvents: PatientTimelineEvent[] = medcareHistory.map((h) => ({
    id: `medcare-${h.id}`,
    patientId,
    kind: "medication_care" as const,
    occurredAt: h.createdAt,
    title: `Medication care · ${h.subjectKind} · ${h.action}`,
    summary: h.reason ?? `${h.action} by ${h.actor}`,
    source: "medication_personalised_care",
    ehrWrite: false as const,
    metadata: {
      subjectKind: h.subjectKind,
      subjectId: h.subjectId,
      sourceStore: "medcare",
    },
  }));

  const agentEvents: PatientTimelineEvent[] = agentHistory.map((h) => ({
    id: `agent-${h.id}`,
    patientId,
    kind: "agent_intelligence" as const,
    occurredAt: h.createdAt,
    title: `Agent · ${h.subjectKind} · ${h.action}`,
    summary: h.reason ?? `${h.action} by ${h.actor}`,
    source: "diabetes_agent_intelligence",
    ehrWrite: false as const,
    metadata: {
      subjectKind: h.subjectKind,
      subjectId: h.subjectId,
      provenance: "agent_intel",
    },
  }));

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
    ...glucoseSeriesEvents,
    ...glucoseReviewEvents,
    ...medcareEvents,
    ...agentEvents,
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
    glucoseEventsMerged: glucoseSeriesEvents.length + glucoseReviewEvents.length,
    medcareEventsMerged: medcareEvents.length,
    agentEventsMerged: agentEvents.length,
  });
}
