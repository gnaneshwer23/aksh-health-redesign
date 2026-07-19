import { NextResponse } from "next/server";

import {
  isPartnerGateId,
  isPartnerGateStatus,
  listPartnerGateArtifacts,
  recordPartnerGateArtifact,
  type PartnerGateId,
  type PartnerGateArtifactStatus,
  PARTNER_GATE_IDS
} from "@/lib/repositories/partner-gate-artifact-repository";
import { persistShieldAuditEvent } from "@/lib/repositories/shield-audit-repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * GET /api/clinical-spine/partner-gates
 * List pending human gate artefacts. Never returns certified:true.
 */
export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const url = new URL(request.url);
  const gateIdParam = url.searchParams.get("gateId");
  const gateId =
    gateIdParam && isPartnerGateId(gateIdParam) ? (gateIdParam as PartnerGateId) : undefined;

  const { records } = await listPartnerGateArtifacts({
    scopeKey: auth.context.scopeKey,
    limit: 50,
    gateId
  });

  return NextResponse.json({
    records,
    allowedGateIds: PARTNER_GATE_IDS,
    allowedStatuses: ["unsigned", "pending_review", "external_ref_noted", "blocked"],
    anyCertified: false,
    liveEmis: false,
    unlocksLiveEmis: false,
    note: "Human artefact tracker only. external_ref_noted is not a signed certification and never flips liveEmis."
  });
}

/**
 * POST /api/clinical-spine/partner-gates
 * Record a pending human gate artefact. Rejects certified/approved payloads.
 * Never unlocks liveEmis.
 */
export async function POST(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  let body: {
    gateId?: string;
    status?: string;
    externalRef?: string;
    note?: string;
    /** Rejected if true — honesty guard */
    certified?: boolean;
    unlocksLiveEmis?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body.", liveEmis: false, certified: false },
      { status: 400 }
    );
  }

  if (body.certified === true || body.unlocksLiveEmis === true) {
    return NextResponse.json(
      {
        error:
          "Cannot mark gate artefacts certified or unlock liveEmis from this API. Record pending/external_ref_noted only.",
        accepted: false,
        liveEmis: false,
        certified: false,
        unlocksLiveEmis: false
      },
      { status: 400 }
    );
  }

  if (!body.gateId || !isPartnerGateId(body.gateId)) {
    return NextResponse.json(
      {
        error: `gateId must be one of: ${PARTNER_GATE_IDS.join(", ")}`,
        liveEmis: false
      },
      { status: 400 }
    );
  }

  if (!body.status || !isPartnerGateStatus(body.status)) {
    return NextResponse.json(
      {
        error: "status must be unsigned | pending_review | external_ref_noted | blocked",
        liveEmis: false
      },
      { status: 400 }
    );
  }

  try {
    const record = await recordPartnerGateArtifact(
      {
        gateId: body.gateId as PartnerGateId,
        status: body.status as PartnerGateArtifactStatus,
        externalRef: body.externalRef,
        note: body.note ?? "",
        actor: auth.context.userEmail ?? auth.context.userId
      },
      { scopeKey: auth.context.scopeKey }
    );

    void persistShieldAuditEvent({
      action: "defer",
      actor: auth.context.userEmail ?? auth.context.userId,
      label: `SHIELD: partner gate artefact ${record.gateId} (${record.status})`,
      detail: "pending human artefact — not certified",
      category: "system",
      agentLabel: "SHIELD",
      resourceRef: record.id,
      payload: {
        certified: false,
        unlocksLiveEmis: false,
        liveEmis: false,
        gateId: record.gateId,
        status: record.status
      }
    });

    return NextResponse.json({
      accepted: true,
      record,
      liveEmis: false,
      certified: false,
      unlocksLiveEmis: false,
      note: "Artefact noted for partner review. Not a signed certification."
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to record gate artefact.",
        accepted: false,
        liveEmis: false,
        certified: false
      },
      { status: 400 }
    );
  }
}
