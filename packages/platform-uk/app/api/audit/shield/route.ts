import { NextResponse } from "next/server";

import {
  listShieldAuditEvents,
  persistShieldAuditEvent
} from "@/lib/repositories/shield-audit-repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response) return auth.response;

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "50");
  const { source, events } = await listShieldAuditEvents({
    limit: Number.isFinite(limit) ? limit : 50
  });

  return NextResponse.json({
    source,
    durable: source === "postgres",
    count: events.length,
    events: events.map((event) => ({
      id: event.id,
      timestamp: event.recordedAt,
      user: event.actor,
      agent: event.agentLabel ?? "SHIELD",
      action: event.label,
      resource: event.resourceRef ?? event.detail ?? event.caseId ?? "—",
      contentHash: event.contentHash,
      prevEventId: event.prevEventId
    }))
  });
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  let body: {
    action?: string;
    label?: string;
    detail?: string;
    agentLabel?: string;
    resourceRef?: string;
    caseId?: string;
    category?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const label = body.label?.trim();
  if (!label) {
    return NextResponse.json({ error: "label is required." }, { status: 400 });
  }

  const result = await persistShieldAuditEvent({
    action: body.action?.trim() || "defer",
    actor: auth.context.userEmail ?? auth.context.userId,
    label,
    detail: body.detail,
    category: body.category ?? "reviewer_decision",
    agentLabel: body.agentLabel,
    resourceRef: body.resourceRef,
    caseId: body.caseId
  });

  if (!result.persisted) {
    return NextResponse.json(
      {
        error: "Durable audit unavailable (DATABASE_URL / Postgres).",
        durable: false,
        reason: result.reason
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ durable: true, event: result.row });
}
