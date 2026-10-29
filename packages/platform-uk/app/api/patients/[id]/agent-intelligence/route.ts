import { NextResponse } from "next/server";

import {
  buildAgentIntelligence,
  runAgentOrchestration,
  seedAndBuildAgentIntelligence,
} from "@/lib/diabetes-intelligence";
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

  let body: { action?: "seed_synthetic" | "run_orchestration" } = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const actor = auth.context.userEmail ?? auth.context.userId;
  const scopeKey = auth.context.scopeKey;

  try {
    if (body.action === "seed_synthetic") {
      const snapshot = await seedAndBuildAgentIntelligence(patientId, {
        scopeKey,
        actor,
      });
      return NextResponse.json({ ...snapshot, action: body.action });
    }

    if (body.action === "run_orchestration") {
      const snapshot = await runAgentOrchestration(patientId, {
        scopeKey,
        actor,
      });
      return NextResponse.json({ ...snapshot, action: body.action });
    }

    return NextResponse.json(
      { error: "action must be seed_synthetic | run_orchestration" },
      { status: 400 }
    );
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    const message = err instanceof Error ? err.message : "Request failed";
    return NextResponse.json({ error: message, ehrWrite: false }, { status });
  }
}
