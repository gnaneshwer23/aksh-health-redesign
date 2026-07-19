import { NextResponse } from "next/server";

import type { LearningOutcomeKind } from "@/lib/clinical-proof/learning-loop";
import {
  buildOutcomesLoopStatus,
  captureSpineOutcome,
  listSpineCareActions,
  type OutcomeReporterRole
} from "@/lib/clinical-spine/outcomes-loop";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const OUTCOMES: LearningOutcomeKind[] = [
  "care_action_completed",
  "care_action_deferred",
  "adverse_event_none",
  "adverse_event_suspected",
  "follow_up_scheduled",
  "unknown"
];

const REPORTERS: OutcomeReporterRole[] = ["clinician", "patient", "admin"];

/**
 * GET /api/clinical-spine/outcomes
 * List open care actions + loop status for a patient (or practice scope).
 */
export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const url = new URL(request.url);
  const patientId = url.searchParams.get("patientId")?.trim() || undefined;
  const view = url.searchParams.get("view")?.trim() || "status";

  try {
    if (view === "actions") {
      const { source, actions } = await listSpineCareActions({
        scopeKey: auth.context.scopeKey,
        patientId,
        limit: 100
      });
      return NextResponse.json({
        source,
        actions,
        autoRetrain: false,
        modelUpdated: false,
        ehrWrite: false,
        liveEmis: false,
        physiologicalTwin: false
      });
    }

    const status = await buildOutcomesLoopStatus({
      scopeKey: auth.context.scopeKey,
      patientId
    });
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Outcomes loop status failed.",
        autoRetrain: false,
        ehrWrite: false,
        liveEmis: false
      },
      { status: 400 }
    );
  }
}

/**
 * POST /api/clinical-spine/outcomes
 * Capture eventual outcome linked to a prior spine care-action learning event.
 * Append-only; never auto-retrains.
 */
export async function POST(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  let body: {
    sourceEventId?: string;
    outcomeKind?: string;
    outcomeSummary?: string;
    outcomeMetric?: { name: string; value: number | string; unit?: string };
    decisionNotes?: string;
    reporterRole?: string;
    healthPlanId?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body.", autoRetrain: false, ehrWrite: false },
      { status: 400 }
    );
  }

  if (!body.sourceEventId?.trim()) {
    return NextResponse.json(
      { error: "sourceEventId is required.", autoRetrain: false, ehrWrite: false },
      { status: 400 }
    );
  }

  if (!body.outcomeKind || !OUTCOMES.includes(body.outcomeKind as LearningOutcomeKind)) {
    return NextResponse.json(
      {
        error: `outcomeKind must be one of: ${OUTCOMES.join(", ")}`,
        autoRetrain: false,
        ehrWrite: false
      },
      { status: 400 }
    );
  }

  const reporterRole = (body.reporterRole ?? "clinician") as OutcomeReporterRole;
  if (!REPORTERS.includes(reporterRole)) {
    return NextResponse.json(
      {
        error: `reporterRole must be one of: ${REPORTERS.join(", ")}`,
        autoRetrain: false,
        ehrWrite: false
      },
      { status: 400 }
    );
  }

  try {
    const result = await captureSpineOutcome(
      {
        sourceEventId: body.sourceEventId.trim(),
        outcomeKind: body.outcomeKind as LearningOutcomeKind,
        outcomeSummary: body.outcomeSummary,
        outcomeMetric: body.outcomeMetric,
        decisionNotes: body.decisionNotes,
        reporterRole,
        healthPlanId: body.healthPlanId ?? null
      },
      {
        scopeKey: auth.context.scopeKey,
        actor: auth.context.userEmail ?? auth.context.userId
      }
    );
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Outcome capture failed.";
    const status = /not found/i.test(message) ? 404 : 400;
    return NextResponse.json(
      { error: message, autoRetrain: false, ehrWrite: false, liveEmis: false },
      { status }
    );
  }
}
