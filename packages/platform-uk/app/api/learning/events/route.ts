import { NextResponse } from "next/server";

import type { LearningDecision, LearningOutcomeKind } from "@/lib/clinical-proof/learning-loop";
import { listLearningEvents, recordLearningEvent } from "@/lib/repositories/learning-event-repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const dynamic = "force-dynamic";

const DECISIONS: LearningDecision[] = ["accept", "edit", "reject", "defer"];
const OUTCOMES: LearningOutcomeKind[] = [
  "care_action_completed",
  "care_action_deferred",
  "adverse_event_none",
  "adverse_event_suspected",
  "follow_up_scheduled",
  "unknown"
];

/**
 * Continuous-learning recorder API (append-only).
 * GET — list recent events
 * POST — record prediction → clinician decision → outcome
 * No PUT / PATCH / DELETE — no silent model updates / no auto-retrain.
 */
export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "50");
  const { source, events } = await listLearningEvents({
    limit: Number.isFinite(limit) ? limit : 50,
    scopeKey: auth.context.scopeKey
  });

  return NextResponse.json({
    source,
    count: events.length,
    autoRetrain: false,
    modelUpdates: false,
    hitlMandatory: true,
    events
  });
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  let body: {
    agentLabel?: string;
    predictionId?: string;
    predictionSummary?: string;
    modelVersion?: string;
    decision?: string;
    decisionNotes?: string;
    outcomeKind?: string;
    outcomeSummary?: string;
    outcomeMetric?: { name: string; value: number | string; unit?: string };
    patientId?: string;
    caseId?: string;
    queueItemId?: string;
    practiceId?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.agentLabel?.trim() || !body.predictionId?.trim()) {
    return NextResponse.json(
      { error: "agentLabel and predictionId are required." },
      { status: 400 }
    );
  }

  if (!body.decision || !DECISIONS.includes(body.decision as LearningDecision)) {
    return NextResponse.json(
      { error: `decision must be one of: ${DECISIONS.join(", ")}` },
      { status: 400 }
    );
  }

  // outcomeKind optional — default unknown; link eventual outcome later via POST .../outcome
  if (body.outcomeKind && !OUTCOMES.includes(body.outcomeKind as LearningOutcomeKind)) {
    return NextResponse.json(
      { error: `outcomeKind must be one of: ${OUTCOMES.join(", ")}` },
      { status: 400 }
    );
  }

  const { event, source } = await recordLearningEvent(
    {
      agentLabel: body.agentLabel,
      predictionId: body.predictionId,
      predictionSummary: body.predictionSummary,
      modelVersion: body.modelVersion,
      decision: body.decision as LearningDecision,
      decisionActor: auth.context.userEmail ?? auth.context.userId,
      decisionNotes: body.decisionNotes,
      outcomeKind: (body.outcomeKind as LearningOutcomeKind | undefined) ?? "unknown",
      outcomeSummary: body.outcomeSummary,
      outcomeMetric: body.outcomeMetric,
      patientId: body.patientId,
      caseId: body.caseId,
      queueItemId: body.queueItemId,
      practiceId: body.practiceId
    },
    { scopeKey: auth.context.scopeKey }
  );

  return NextResponse.json({
    recorded: true,
    source,
    autoRetrainTriggered: false,
    modelUpdated: false,
    ehrWrite: false,
    hitlRequired: true,
    event
  });
}
