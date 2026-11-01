/**
 * Milestone C3 — Accept / Edit / Reject on lab or pharmacy HITL drafts.
 * Simulation only — no live lab vendor / EPS / EHR write.
 */
import { NextResponse } from "next/server";

import { LAB_PHARMACY_HITL_HONESTY } from "@/lib/lab-pharmacy-hitl";
import { reviewAndPersistLabPharmacyDraft } from "@/lib/repositories/lab-pharmacy-hitl-repository";
import { resolveTenantContext } from "@/lib/db/tenant-context";
import { AGENT_OPS_ROLES, REVIEW_DECISION_ROLES } from "@/lib/security/agent-authz";
import { requireAppRole } from "@/lib/user-scope";

export const dynamic = "force-dynamic";

const REVIEW_ROLES = [...new Set([...AGENT_OPS_ROLES, ...REVIEW_DECISION_ROLES])];

export async function POST(request: Request) {
  const auth = await requireAppRole(request, REVIEW_ROLES);
  if (auth.response || !auth.context) return auth.response;

  let body: {
    draftId?: string;
    decision?: string;
    note?: string;
    editedContent?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.draftId?.trim()) {
    return NextResponse.json({ error: "draftId is required." }, { status: 400 });
  }
  if (body.decision !== "accept" && body.decision !== "edit" && body.decision !== "reject") {
    return NextResponse.json(
      { error: 'decision must be "accept" | "edit" | "reject".' },
      { status: 400 }
    );
  }

  const tenant = resolveTenantContext(request, auth.context);
  const actor = auth.context.userEmail ?? auth.context.userId;
  const storeKey = `practice_${tenant.practiceId}`.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);

  try {
    const result = await reviewAndPersistLabPharmacyDraft(
      {
        draftId: body.draftId.trim(),
        decision: body.decision,
        note: body.note,
        editedContent: body.editedContent,
        actor,
        scopeKey: storeKey,
        roleHint: auth.context.clinicalPersona ?? auth.context.userRole,
      },
      {
        role: auth.context.userRole,
        persona: auth.context.clinicalPersona,
        practiceId: tenant.practiceId,
      }
    );

    return NextResponse.json({
      ...LAB_PHARMACY_HITL_HONESTY,
      ok: true,
      draft: result.draft,
      source: result.source,
      shieldLogged: result.shieldLogged,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Review failed";
    const status = /Forbidden|organisation/i.test(message)
      ? 403
      : /Unknown draftId/i.test(message)
        ? 404
        : 400;
    return NextResponse.json({ error: message, ...LAB_PHARMACY_HITL_HONESTY }, { status });
  }
}
