import { NextResponse } from "next/server";

import { denyUnlessConnectedPatientAccess } from "@/lib/clinical-proof/connected-patient-access";
import {
  buildAgentIntelligence,
  runDiabetesAgentIntelAssemble,
  seedAndBuildAgentIntelligence,
} from "@/lib/diabetes-intelligence";
import { readCareEpisodeId } from "@/lib/care-episode";
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

  const snapshot = await buildAgentIntelligence(patientId, {
    scopeKey: auth.context.scopeKey,
  });
  return NextResponse.json(snapshot);
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const patientId = (await context.params).id?.trim();
  if (!patientId) {
    return NextResponse.json({ error: "patient id required" }, { status: 400 });
  }

  const denied = denyUnlessConnectedPatientAccess(auth.context, patientId);
  if (denied) return denied;

  let body: {
    action?: "seed_synthetic" | "run_orchestration" | "run_diabetes_agent_intel";
    careEpisodeId?: string;
    care_episode_id?: string;
    enqueueToSpineReview?: boolean;
  } = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const actor = auth.context.userEmail ?? auth.context.userId;
  const ownerUserId = auth.context.userId;
  const scopeKey = auth.context.scopeKey;
  const careEpisodeId = readCareEpisodeId(body);

  try {
    if (body.action === "seed_synthetic") {
      const snapshot = await seedAndBuildAgentIntelligence(patientId, {
        scopeKey,
        actor,
        ownerUserId,
        careEpisodeId,
        enqueueToSpineReview: body.enqueueToSpineReview,
      });
      return NextResponse.json({ ...snapshot, action: body.action, careEpisodeId });
    }

    // run_orchestration kept as alias for API stability; implementation is diabetes assemble (not CONDUCTOR).
    if (body.action === "run_orchestration" || body.action === "run_diabetes_agent_intel") {
      const snapshot = await runDiabetesAgentIntelAssemble(patientId, {
        scopeKey,
        actor,
        ownerUserId,
        careEpisodeId,
        enqueueToSpineReview: body.enqueueToSpineReview,
      });
      return NextResponse.json({
        ...snapshot,
        action: body.action,
        careEpisodeId,
        orchestratorContract: "diabetes_agent_intel_assemble",
        note:
          "run_orchestration on this route is diabetes agent-intel assemble, not clinical-spine CONDUCTOR (lib/clinical-proof/agent-orchestration.ts).",
      });
    }

    return NextResponse.json(
      { error: "action must be seed_synthetic | run_orchestration | run_diabetes_agent_intel" },
      { status: 400 }
    );
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    const message = err instanceof Error ? err.message : "Request failed";
    return NextResponse.json({ error: message, ehrWrite: false }, { status });
  }
}
