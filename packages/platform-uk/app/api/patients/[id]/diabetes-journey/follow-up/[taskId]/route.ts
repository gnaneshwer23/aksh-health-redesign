import { NextResponse } from "next/server";

import { denyUnlessConnectedPatientAccess } from "@/lib/clinical-proof/connected-patient-access";
import { advanceFollowUp } from "@/lib/diabetes-intelligence/journey";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

type RouteContext = { params: Promise<{ id: string; taskId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const { id, taskId } = await context.params;
  const patientId = id?.trim();
  const task = taskId?.trim();
  if (!patientId || !task) {
    return NextResponse.json({ error: "patient id and taskId required" }, { status: 400 });
  }

  const denied = denyUnlessConnectedPatientAccess(auth.context, patientId);
  if (denied) return denied;

  let body: { action?: "acknowledge" | "complete" | "cancel"; note?: string } = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.action || !["acknowledge", "complete", "cancel"].includes(body.action)) {
    return NextResponse.json(
      { error: "action must be acknowledge | complete | cancel" },
      { status: 400 }
    );
  }

  try {
    const journey = await advanceFollowUp(
      { patientId, taskId: task, action: body.action, note: body.note },
      { scopeKey: auth.context.scopeKey }
    );
    return NextResponse.json({ ...journey, ehrWrite: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Follow-up update failed";
    const status = /not found/i.test(message) ? 404 : 500;
    return NextResponse.json({ error: message, ehrWrite: false }, { status });
  }
}
