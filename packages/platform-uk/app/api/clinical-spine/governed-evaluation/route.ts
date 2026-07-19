import { NextResponse } from "next/server";

import {
  buildOutcomesLoopStatus,
  submitGovernedEvaluation,
  type GovernedGateCheck
} from "@/lib/clinical-spine/outcomes-loop";
import { listGovernedEvaluations } from "@/lib/repositories/governed-evaluation-repository";
import type { GovernedProposedAction } from "@/lib/repositories/governed-evaluation-repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const ACTIONS: GovernedProposedAction[] = [
  "no_change",
  "schedule_human_review",
  "propose_model_update"
];

/**
 * GET /api/clinical-spine/governed-evaluation
 * List recent evaluation reviews + loop status summary.
 */
export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  try {
    const [evaluations, loop] = await Promise.all([
      listGovernedEvaluations({ scopeKey: auth.context.scopeKey, limit: 50 }),
      buildOutcomesLoopStatus({ scopeKey: auth.context.scopeKey })
    ]);

    return NextResponse.json({
      records: evaluations.records,
      loop,
      autoRetrain: false,
      modelUpdated: false,
      ehrWrite: false,
      liveEmis: false,
      physiologicalTwin: false,
      sop: "docs/GOVERNED_MODEL_RELEASE_SOP.md",
      note: "Evaluation reviews never auto-retrain. propose_model_update requires G-ML-1…3 signed."
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Governed evaluation list failed.",
        autoRetrain: false
      },
      { status: 400 }
    );
  }
}

/**
 * POST /api/clinical-spine/governed-evaluation
 * Record a governed evaluation review. Blocks propose_model_update without G-ML gates.
 * Never sets autoRetrain or modelUpdated true.
 */
export async function POST(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  let body: {
    learningEventIdsReviewed?: string[];
    gates?: GovernedGateCheck[];
    proposedAction?: string;
    rationale?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body.", autoRetrain: false, modelUpdated: false },
      { status: 400 }
    );
  }

  if (!body.proposedAction || !ACTIONS.includes(body.proposedAction as GovernedProposedAction)) {
    return NextResponse.json(
      {
        error: `proposedAction must be one of: ${ACTIONS.join(", ")}`,
        autoRetrain: false,
        modelUpdated: false
      },
      { status: 400 }
    );
  }

  const result = await submitGovernedEvaluation(
    {
      learningEventIdsReviewed: Array.isArray(body.learningEventIdsReviewed)
        ? body.learningEventIdsReviewed.filter((id) => typeof id === "string" && id.trim())
        : [],
      gates: Array.isArray(body.gates) ? body.gates : [],
      proposedAction: body.proposedAction as GovernedProposedAction,
      rationale: body.rationale ?? "",
      actor: auth.context.userEmail ?? auth.context.userId
    },
    { scopeKey: auth.context.scopeKey }
  );

  if (!result.accepted) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
