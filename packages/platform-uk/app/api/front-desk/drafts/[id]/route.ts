import { NextResponse } from "next/server";
import { z } from "zod";

import { getOptionalAuthenticatedUserScope } from "@/lib/front-desk/auth";
import { mutateState } from "@/lib/front-desk/store";
import { decideDraft } from "@/lib/front-desk/workflows";
import { persistShieldAuditEvent } from "@/lib/repositories/shield-audit-repository";

export const dynamic = "force-dynamic";

const schema = z.object({ decision: z.enum(["accept", "reject"]), reason: z.string().max(500).optional() });

/**
 * POST /api/front-desk/drafts/[id] — GP decision on patient-reported data (EC-CLIN-3).
 * Accept stages FHIR (BRIDGE rehearsal, liveEmis:false). Every decision is SHIELD-audited.
 */
export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auth = await getOptionalAuthenticatedUserScope(request);
  if (!auth) return NextResponse.json({ error: "Sign in as a GP to accept or reject patient-reported data." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const actor = auth.userEmail ?? auth.userId;
  const { result } = await mutateState((s) =>
    decideDraft(s, { draftId: params.id, decision: parsed.data.decision, reason: parsed.data.reason, actor, persona: auth.clinicalPersona })
  );
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

  const shield = await persistShieldAuditEvent({
    action: parsed.data.decision,
    actor,
    label: `SHIELD: patient-reported data ${result.draft.status} (Front Desk)`,
    detail: `${result.draft.summary}${result.draft.reason ? ` Reason: ${result.draft.reason}` : ""}`.slice(0, 280),
    category: "reviewer_decision",
    agentLabel: "CANVAS",
    resourceRef: result.draft.patientId,
  });
  return NextResponse.json({
    draft: result.draft,
    shieldLogged: shield.persisted,
    ehrWrite: false,
    liveEmis: false,
  });
}
