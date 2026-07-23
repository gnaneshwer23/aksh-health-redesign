import { NextResponse } from "next/server";

import {
  attemptEmisPartnerSandboxWrite,
  getEmisPartnerSandboxStatus,
  probeEmisPartnerSandboxOAuth
} from "@/lib/emis-partner-sandbox";
import { canFlipLiveEmisInCode } from "@/lib/clinical-spine/partner-readiness";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * GET /api/integrations/emis-partner-sandbox
 * N5 Partner sandbox honesty status.
 * Optional ?probe=auth for sandbox OAuth (never flips liveEmis).
 */
export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response) return auth.response;

  const url = new URL(request.url);
  const probe = url.searchParams.get("probe");
  const status = getEmisPartnerSandboxStatus();

  if (probe === "auth") {
    const oauth = await probeEmisPartnerSandboxOAuth();
    return NextResponse.json({
      status,
      oauth,
      liveEmis: false,
      canFlipLiveEmisInCode: canFlipLiveEmisInCode(),
      note: "Sandbox OAuth probe complete. Env ≠ live flip. liveEmis:false."
    });
  }

  return NextResponse.json({
    ...status,
    liveEmis: false,
    canFlipLiveEmisInCode: canFlipLiveEmisInCode(),
    banner:
      "NOT LIVE EMIS — Partner sandbox is feature-flagged. Flag off = sim path. Flag on without creds = needs_partner."
  });
}

/**
 * POST /api/integrations/emis-partner-sandbox
 * Accept-gated sandbox write attempt — never sets liveEmis / never autonomous.
 * Body: { hitlAccepted: true, caseId?, bundleSummary? }
 */
export async function POST(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  let body: {
    hitlAccepted?: boolean;
    caseId?: string;
    bundleSummary?: string;
    /** Rejected if true — honesty guard */
    liveEmis?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body.", liveEmis: false, accepted: false },
      { status: 400 }
    );
  }

  if (body.liveEmis === true) {
    return NextResponse.json(
      {
        error: "Cannot set liveEmis from Partner sandbox API. Requires N7 signed go/no-go.",
        accepted: false,
        liveEmis: false,
        canFlipLiveEmisInCode: false
      },
      { status: 400 }
    );
  }

  const result = attemptEmisPartnerSandboxWrite({
    hitlAccepted: body.hitlAccepted === true,
    approvedBy: auth.context.userEmail ?? auth.context.userId,
    caseId: body.caseId,
    bundleSummary: body.bundleSummary
  });

  return NextResponse.json(
    {
      ...result,
      canFlipLiveEmisInCode: canFlipLiveEmisInCode(),
      status: getEmisPartnerSandboxStatus()
    },
    { status: result.ok ? 200 : 400 }
  );
}
