import { NextResponse } from "next/server";

import { decideJourneyCarePlan } from "@/lib/diabetes-intelligence/journey";
import type { CarePlanDecisionAction, CarePlanSection } from "@/lib/diabetes-intelligence/types";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

type RouteContext = { params: Promise<{ id: string; planId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const { id, planId } = await context.params;
  const patientId = id?.trim();
  const plan = planId?.trim();
  if (!patientId || !plan) {
    return NextResponse.json({ error: "patient id and planId required" }, { status: 400 });
  }

  let body: {
    action?: CarePlanDecisionAction;
    reason?: string;
    editedSections?: CarePlanSection[];
  } = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.action || !["accept", "edit", "reject"].includes(body.action)) {
    return NextResponse.json({ error: "action must be accept | edit | reject" }, { status: 400 });
  }

  try {
    const journey = await decideJourneyCarePlan(
      {
        patientId,
        planId: plan,
        action: body.action,
        actor: auth.context.userEmail ?? auth.context.userId,
        reason: body.reason,
        editedSections: body.editedSections,
      },
      { scopeKey: auth.context.scopeKey }
    );
    return NextResponse.json({
      ...journey,
      ehrWrite: false,
      hitlRequired: true,
      note: "Decision persisted; no EHR write.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Decision failed";
    const status = /not found/i.test(message) ? 404 : /requires|only DRAFT/i.test(message) ? 400 : 500;
    return NextResponse.json({ error: message, ehrWrite: false }, { status });
  }
}
