import { NextResponse } from "next/server";

import {
  listShieldAuditEvents,
  persistShieldAuditEvent
} from "@/lib/repositories/shield-audit-repository";
import { AGENTS } from "@/lib/agents/register";
import { resolveTenantContext } from "@/lib/db/tenant-context";
import { readReviewCases } from "@/lib/review-case-repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

/**
 * Dashboard panels record what a signed-in user did with an agent output (acknowledged, accepted, exported). The server
 * decides who (signed-in account), where (the user's practice), and marks the origin; the browser may only choose from
 * fixed actions and agent labels, and may reference only its own review cases. Case and draft decisions themselves are
 * recorded by the decision endpoints, never here.
 */
const PANEL_ACTIONS = new Set(["accept", "edit", "reject", "defer", "export", "view"]);
const PANEL_CATEGORIES = new Set(["reviewer_decision", "reviewer_note", "system"]);
const PANEL_AGENTS = new Set<string>([...AGENTS.flatMap((a) => [a.id, ...a.legacyIds]), "TWIN_SIM"]);
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

  const label = cap(body.label, 200);
  if (!label) {
    return NextResponse.json({ error: "label is required." }, { status: 400 });
  }
  const action = cap(body.action, 20) ?? "view";
  if (!PANEL_ACTIONS.has(action)) return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  const category = cap(body.category, 40) ?? "reviewer_note";
  if (!PANEL_CATEGORIES.has(category)) return NextResponse.json({ error: "Unknown category." }, { status: 400 });
  const agentLabel = cap(body.agentLabel, 40);
  if (agentLabel && !PANEL_AGENTS.has(agentLabel)) return NextResponse.json({ error: "Unknown agent." }, { status: 400 });
  const tenant = resolveTenantContext(request, auth.context);
  const caseId = cap(body.caseId, 120);
  if (caseId) {
    const own = (await readReviewCases(auth.context.scopeKey, tenant.practiceId)).find((c) => c.id === caseId);
    if (!own || (own.userId && own.userId !== auth.context.userId)) {
      return NextResponse.json({ error: "That case is not yours." }, { status: 403 });
    }
  }

  const result = await persistShieldAuditEvent({
    action,
    actor: auth.context.userEmail ?? auth.context.userId,
    label,
    detail: cap(body.detail, 1000),
    category,
    agentLabel,
    resourceRef: cap(body.resourceRef, 200),
    caseId,
    practiceId: tenant.practiceId,
    payload: { origin: "dashboard_panel" }
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
