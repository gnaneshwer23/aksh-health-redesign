import { NextResponse } from "next/server";

import { listShieldAuditEvents } from "@/lib/repositories/shield-audit-repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const dynamic = "force-dynamic";

/**
 * Pharmacist medication-review persistence is stored as durable SHIELD audit rows
 * (no separate med-review table in this proof build).
 */
export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response) return auth.response;

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "40");

  const { source, events } = await listShieldAuditEvents({
    limit: Number.isFinite(limit) ? limit : 40,
    agentLabel: "GUARDIAN",
    labelContains: "pharmacist medication review"
  });

  return NextResponse.json({
    durable: source === "postgres",
    source,
    count: events.length,
    reviews: events.map((event) => ({
      id: event.id,
      recordedAt: event.recordedAt,
      actor: event.actor,
      action: event.action,
      label: event.label,
      detail: event.detail,
      resourceRef: event.resourceRef,
      contentHash: event.contentHash
    })),
    note:
      source === "postgres"
        ? "Completed pharmacist reviews persisted via SHIELD audit (aksh.shield_audit_events)."
        : "Durable Postgres trail unavailable — reviews remain local until DATABASE_URL is live."
  });
}
