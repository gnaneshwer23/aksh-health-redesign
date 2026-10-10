import { NextResponse } from "next/server";
import { z } from "zod";

import { withDeskDirectory } from "@/lib/front-desk/directory";
import { mutateState } from "@/lib/front-desk/store";
import { approveCampaign, canApproveCampaign, createCampaign, runCampaign } from "@/lib/front-desk/workflows";
import { persistShieldAuditEvent } from "@/lib/repositories/shield-audit-repository";
import { getOptionalAuthenticatedUserScope } from "@/lib/front-desk/auth";

export const dynamic = "force-dynamic";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), kind: z.enum(["missed_appointment", "lapsed_review", "recall", "health_check_in"]) }),
  z.object({ action: z.literal("approve"), id: z.string().max(80) }),
  z.object({ action: z.literal("run"), id: z.string().max(80) }),
]);

/**
 * POST /api/front-desk/campaigns — Recall campaigns.
 * Anyone can draft a campaign on the synthetic practice. Approval needs a signed-in GP
 * (check-ins) or GP / practice manager (admin rebooking). No call is made before approval.
 */
async function handlePOST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const auth = await getOptionalAuthenticatedUserScope(request);
  const actor = auth?.userEmail ?? auth?.userId ?? "demo viewer";

  if (parsed.data.action === "create") {
    const kind = parsed.data.kind;
    const { result } = await mutateState((s) => createCampaign(s, kind, actor));
    return NextResponse.json({ campaign: result });
  }

  if (parsed.data.action === "approve") {
    const id = parsed.data.id;
    if (!auth) return NextResponse.json({ error: "Sign in as a GP or practice manager to approve calls." }, { status: 401 });
    let forbidden = false;
    const { result } = await mutateState((s) => {
      const c = s.campaigns.find((x) => x.id === id);
      if (!c) return null;
      if (!canApproveCampaign(c.kind, auth.clinicalPersona, auth.userRole)) {
        forbidden = true;
        return c;
      }
      return approveCampaign(s, id, actor);
    });
    if (!result) return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    if (forbidden) {
      return NextResponse.json(
        { error: result.kind === "health_check_in" ? "Health check-in calls need a GP to approve." : "Only a GP or practice manager can approve calls." },
        { status: 403 }
      );
    }
    const shield = await persistShieldAuditEvent({
      action: "accept",
      actor,
      label: `SHIELD: Front Desk campaign approved (${result.kind})`,
      detail: `${result.name}; ${result.targets.length} synthetic patients; script approved as shown`,
      category: "reviewer_decision",
      agentLabel: "CANVAS",
      resourceRef: result.id,
    });
    return NextResponse.json({ campaign: result, shieldLogged: shield.persisted });
  }

  const id = parsed.data.id;
  const { result } = await mutateState((s) => runCampaign(s, id));
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ campaign: result.campaign, telephony: "simulated" });
}

/** Patients come from this request's database directory (see lib/front-desk/directory.ts). */
export async function POST(request: Request) {
  return withDeskDirectory(() => handlePOST(request));
}
