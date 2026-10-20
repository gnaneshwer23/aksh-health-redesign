import { NextResponse } from "next/server";

import {
  listShieldAuditEvents,
  persistShieldAuditEvent
} from "@/lib/repositories/shield-audit-repository";
import { composePanelEvent } from "@/lib/audit/panel-events";
import { resolveTenantContext } from "@/lib/db/tenant-context";
import { readReviewCases } from "@/lib/review-case-repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

/**
 * Dashboard panels record what a signed-in user did with an agent output (staged, decided, escalated, exported) as a
 * structured event (lib/audit/panel-events.ts). The server writes the wording, decides who (signed-in account), where
 * (the user's practice) and marks the origin; the browser sends no label text and may reference only its own review
 * cases. Case and draft decisions themselves are recorded by the decision endpoints, never here.
 */
const cap = (v: unknown, n: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, n) : undefined);

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response) return auth.response;

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "50");
  // Only the caller's practice: audit rows from other organisations are never listed.
  const tenant = resolveTenantContext(request, auth.context);
  const { source, events } = await listShieldAuditEvents({
    limit: Number.isFinite(limit) ? limit : 50,
    practiceId: tenant.practiceId
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

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if ("label" in body) {
    return NextResponse.json({ error: "Send a structured event (event, subject, agent, action); the server writes the wording.", code: "LABEL_NOT_ACCEPTED" }, { status: 400 });
  }
  const composed = composePanelEvent({ event: body.event, subject: body.subject, agent: body.agent, action: body.action });
  if ("error" in composed) return NextResponse.json({ error: composed.error }, { status: 400 });

  const tenant = resolveTenantContext(request, auth.context);
  const caseId = cap(body.caseId, 120);
  if (caseId) {
    const own = (await readReviewCases(auth.context.scopeKey, tenant.practiceId)).find((c) => c.id === caseId);
    if (!own || (own.userId && own.userId !== auth.context.userId)) {
      return NextResponse.json({ error: "That case is not yours." }, { status: 403 });
    }
  }

  const result = await persistShieldAuditEvent({
    action: composed.action,
    actor: auth.context.userEmail ?? auth.context.userId,
    label: composed.label,
    // The user's own note, attributed to them; never used as the event wording.
    detail: cap(body.note, 1000),
    category: composed.category,
    agentLabel: composed.agent,
    resourceRef: cap(body.resourceRef, 200),
    caseId,
    practiceId: tenant.practiceId,
    payload: { origin: "dashboard_panel", event: composed.event, subject: composed.subject }
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
