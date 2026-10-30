import { NextResponse } from "next/server";

import { denyUnlessConnectedPatientAccess } from "@/lib/clinical-proof/connected-patient-access";
import { decideMedCarePlan } from "@/lib/diabetes-intelligence";
import type { PersonalisedCarePlanSection } from "@/lib/diabetes-intelligence/medcare-types";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

type RouteContext = { params: Promise<{ id: string; planId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const { id, planId } = await context.params;
  const patientId = id?.trim();
  const pid = planId?.trim();
  if (!patientId || !pid) {
    return NextResponse.json({ error: "patient id and plan id required" }, { status: 400 });
  }

  const denied = denyUnlessConnectedPatientAccess(auth.context, patientId);
  if (denied) return denied;

  let body: {
    action?: "accept" | "edit" | "reject";
    reason?: string;
    editedSections?: PersonalisedCarePlanSection[];
  } = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.action || !["accept", "edit", "reject"].includes(body.action)) {
    return NextResponse.json(
      { error: "action must be accept | edit | reject" },
      { status: 400 }
    );
  }

  try {
    const snapshot = await decideMedCarePlan(
      {
        patientId,
        planId: pid,
        action: body.action,
        actor: auth.context.userEmail ?? auth.context.userId,
        reason: body.reason,
        editedSections: body.editedSections,
      },
      { scopeKey: auth.context.scopeKey }
    );
    return NextResponse.json({
      ...snapshot,
      action: body.action,
      ehrWrite: false,
      autonomousPrescribe: false,
    });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    const message = err instanceof Error ? err.message : "Decision failed";
    return NextResponse.json({ error: message, ehrWrite: false }, { status });
  }
}
