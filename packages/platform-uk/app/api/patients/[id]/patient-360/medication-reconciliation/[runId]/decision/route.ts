import { NextResponse } from "next/server";

import { decideMedicationReconciliation } from "@/lib/patient-intelligence";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

type RouteContext = { params: Promise<{ id: string; runId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const { id: patientIdRaw, runId: runIdRaw } = await context.params;
  const patientId = patientIdRaw?.trim();
  const runId = runIdRaw?.trim();
  if (!patientId || !runId) {
    return NextResponse.json({ error: "patient id and run id required" }, { status: 400 });
  }

  let body: { action?: "complete" | "cancel"; note?: string } = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.action !== "complete" && body.action !== "cancel") {
    return NextResponse.json({ error: "action must be complete | cancel" }, { status: 400 });
  }

  try {
    const profile = await decideMedicationReconciliation(
      {
        patientId,
        runId,
        action: body.action,
        actor: auth.context.userEmail ?? auth.context.userId,
        note: body.note,
      },
      { scopeKey: auth.context.scopeKey }
    );
    return NextResponse.json({
      ...profile,
      action: body.action,
      ehrWrite: false,
      autonomousPrescribe: false,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Decision failed";
    const status = /not found/i.test(message) ? 404 : /already/i.test(message) ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
