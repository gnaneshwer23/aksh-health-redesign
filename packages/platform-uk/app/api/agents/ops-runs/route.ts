/**
 * Milestone A3 — PHI-safe durable CONDUCTOR run visibility for Agent Ops / GP.
 */
import { NextResponse } from "next/server";

import { buildOpsRunVisibility } from "@/lib/agents/ops-run-visibility";
import { resolveTenantContext } from "@/lib/db/tenant-context";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const tenant = resolveTenantContext(request, auth.context);
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "40");

  const summary = await buildOpsRunVisibility({
    scopeKey: auth.context.scopeKey,
    limit: Number.isFinite(limit) ? limit : 40,
    organisationId: tenant.practiceId ?? null,
  });

  return NextResponse.json({
    ...summary,
    practiceId: tenant.practiceId,
    // Never echo patient labels from durable store.
    patientLabelsOmitted: true,
  });
}
