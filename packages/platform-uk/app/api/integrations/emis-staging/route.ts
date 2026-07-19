import { NextResponse } from "next/server";

import {
  getEmisIntegrationStatus,
  listEmisStagingQueue,
  queueEmisFhirStaging
} from "@/lib/emis-staging";
import { persistShieldAuditEvent } from "@/lib/repositories/shield-audit-repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response) return auth.response;

  const status = getEmisIntegrationStatus();
  return NextResponse.json({
    ...status,
    liveEmis: false,
    queue: listEmisStagingQueue(20),
    banner: status.notLiveBanner
  });
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  let body: { caseId?: string; practiceOds?: string; bundleSummary?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const bundleSummary = body.bundleSummary?.trim();
  if (!bundleSummary) {
    return NextResponse.json({ error: "bundleSummary is required." }, { status: 400 });
  }

  const entry = queueEmisFhirStaging({
    approvedBy: auth.context.userEmail ?? auth.context.userId,
    caseId: body.caseId,
    practiceOds: body.practiceOds,
    bundleSummary
  });

  void persistShieldAuditEvent({
    action: "defer",
    actor: auth.context.userEmail ?? auth.context.userId,
    label: "SHIELD: EMIS staging queue (no live write-back)",
    detail: entry.status,
    category: "system",
    caseId: body.caseId,
    agentLabel: "SHIELD",
    resourceRef: entry.id,
    payload: { ehrWriteAttempted: false }
  });

  const status = getEmisIntegrationStatus();
  return NextResponse.json({
    entry,
    liveWriteBack: false,
    liveEmis: false,
    banner: status.notLiveBanner,
    message:
      "Queued internally for partner-track rehearsal. No EMIS write was attempted. NOT LIVE EMIS."
  });
}
