import { NextResponse } from "next/server";

import {
  attemptSimulatedEhrWrite,
  getEhrWritebackSimStatus,
  issueClinicianApprovalToken,
  listSimulatedEhrWrites
} from "@/lib/clinical-proof/ehr-writeback-sim";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

/**
 * Simulated EHR write-back test double.
 * Proves HITL-gated architecture. Never calls live EMIS.
 */
export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response) return auth.response;

  return NextResponse.json({
    ...getEhrWritebackSimStatus(),
    recentWrites: listSimulatedEhrWrites(10),
    blockedPartnerPaths: {
      emisLiveWriteBack: "BLOCKED: partner",
      systmOneLiveWriteBack: "BLOCKED: partner",
      cis2: "BLOCKED: partner"
    }
  });
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  let body: {
    action?: "issue-approval" | "write";
    approvalToken?: string;
    resourceSummary?: string;
    caseId?: string;
    queueItemId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const clinicianId = auth.context.userId;
  const clinicianName = auth.context.userEmail ?? auth.context.userId;

  if (body.action === "issue-approval") {
    const summary = body.resourceSummary?.trim();
    if (!summary) {
      return NextResponse.json({ error: "resourceSummary is required to issue approval." }, { status: 400 });
    }
    const approval = issueClinicianApprovalToken({
      clinicianId,
      clinicianName,
      resourceSummary: summary,
      caseId: body.caseId,
      queueItemId: body.queueItemId
    });
    return NextResponse.json({
      approval,
      liveEmis: false,
      note: "Approval token issued for simulated write-back only."
    });
  }

  // Default: attempt write
  const result = attemptSimulatedEhrWrite({
    approvalToken: body.approvalToken,
    resourceSummary: body.resourceSummary,
    actorId: clinicianId
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        liveEmis: false,
        liveWriteBack: false,
        status: "BLOCKED_WITHOUT_VALID_HITL_APPROVAL"
      },
      { status: result.status }
    );
  }

  return NextResponse.json({
    write: result.write,
    liveEmis: false,
    liveWriteBack: false,
    message: "Simulated write recorded. Live EHR remains BLOCKED: partner."
  });
}
