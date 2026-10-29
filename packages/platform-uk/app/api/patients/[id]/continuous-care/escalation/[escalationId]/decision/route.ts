import { NextResponse } from "next/server";

import { decideStaffEscalation } from "@/lib/diabetes-intelligence";
import type { ContinuousCareDecisionAction } from "@/lib/diabetes-intelligence/continuous-care-types";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

type RouteContext = { params: Promise<{ id: string; escalationId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const { id: patientIdRaw, escalationId: escalationIdRaw } = await context.params;
  const patientId = patientIdRaw?.trim();
  const escalationId = escalationIdRaw?.trim();
  if (!patientId || !escalationId) {
    return NextResponse.json({ error: "patient id and escalation id required" }, { status: 400 });
  }

  let body: {
    action?: ContinuousCareDecisionAction;
    reason?: string;
    editedNote?: string;
  } = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.action || !["accept", "edit", "reject", "resolve", "queue"].includes(body.action)) {
    return NextResponse.json(
      { error: "action must be accept | edit | reject | resolve | queue" },
      { status: 400 }
    );
  }

  const actor = auth.context.userEmail ?? auth.context.userId;

  try {
    const snapshot = await decideStaffEscalation(
      {
        patientId,
        escalationId,
        action: body.action,
        actor,
        reason: body.reason,
        editedNote: body.editedNote,
      },
      { scopeKey: auth.context.scopeKey }
    );
    return NextResponse.json({
      ...snapshot,
      action: body.action,
      ehrWrite: false,
      autonomousClinicalAction: false,
    });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    const message = err instanceof Error ? err.message : "Request failed";
    return NextResponse.json({ error: message, ehrWrite: false }, { status });
  }
}
