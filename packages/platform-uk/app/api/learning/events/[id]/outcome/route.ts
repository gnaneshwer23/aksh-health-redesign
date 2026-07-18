import { NextResponse } from "next/server";

import type { LearningOutcomeKind } from "@/lib/clinical-proof/learning-loop";
import { linkLearningOutcome } from "@/lib/repositories/learning-event-repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const dynamic = "force-dynamic";

const OUTCOMES: LearningOutcomeKind[] = [
  "care_action_completed",
  "care_action_deferred",
  "adverse_event_none",
  "adverse_event_suspected",
  "follow_up_scheduled",
  "unknown"
];

type RouteContext = { params: { id: string } };

/**
 * Append-only eventual outcome link for an existing learning event.
 * Never UPDATEs the source row. Never auto-retrains / bumps model versions.
 */
export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const sourceEventId = context.params.id?.trim();
  if (!sourceEventId) {
    return NextResponse.json({ error: "Learning event id is required." }, { status: 400 });
  }

  let body: {
    outcomeKind?: string;
    outcomeSummary?: string;
    outcomeMetric?: { name: string; value: number | string; unit?: string };
    decisionNotes?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.outcomeKind || !OUTCOMES.includes(body.outcomeKind as LearningOutcomeKind)) {
    return NextResponse.json(
      { error: `outcomeKind must be one of: ${OUTCOMES.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const { event, source, sourceEvent } = await linkLearningOutcome(
      sourceEventId,
      {
        outcomeKind: body.outcomeKind as LearningOutcomeKind,
        outcomeSummary: body.outcomeSummary,
        outcomeMetric: body.outcomeMetric,
        decisionActor: auth.context.userEmail ?? auth.context.userId,
        decisionNotes: body.decisionNotes
      },
      { scopeKey: auth.context.scopeKey }
    );

    return NextResponse.json({
      linked: true,
      source,
      autoRetrainTriggered: false,
      modelUpdated: false,
      ehrWrite: false,
      hitlRequired: true,
      sourceEventId: sourceEvent.id,
      event
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = /not found/i.test(message) ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
