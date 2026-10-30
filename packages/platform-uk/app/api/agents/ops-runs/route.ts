/**
 * Milestone A3/A4 — PHI-safe durable CONDUCTOR run visibility + alert signals for Agent Ops.
 */
import { NextResponse } from "next/server";

import { buildOpsAlerts } from "@/lib/agents/ops-alerts";
import { buildOpsRunVisibility } from "@/lib/agents/ops-run-visibility";
import { enforceOpsRunsRateLimit } from "@/lib/agents/rate-limit-guards";
import { listCareEpisodesForScope } from "@/lib/care-episode";
import { resolveTenantContext } from "@/lib/db/tenant-context";
import { AGENT_OPS_ROLES } from "@/lib/security/agent-authz";
import { requireAppRole } from "@/lib/user-scope";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: Request) {
  const auth = await requireAppRole(request, AGENT_OPS_ROLES);
  if (auth.response || !auth.context) return auth.response;

  const limited = await enforceOpsRunsRateLimit(request, auth.context.userId);
  if (limited) return limited;

  const tenant = resolveTenantContext(request, auth.context);
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "40");
  const includeAlerts = url.searchParams.get("alerts") !== "0";

  const summary = await buildOpsRunVisibility({
    scopeKey: auth.context.scopeKey,
    limit: Number.isFinite(limit) ? limit : 40,
    organisationId: tenant.practiceId ?? null,
  });

  const episodes = includeAlerts
    ? await listCareEpisodesForScope(auth.context.scopeKey, 100)
    : [];
  const alerts = includeAlerts
    ? await buildOpsAlerts({
        scopeKey: auth.context.scopeKey,
        limit: 100,
        episodes,
      })
    : null;

  return NextResponse.json({
    ...summary,
    alerts,
    practiceId: tenant.practiceId,
    // Never echo patient labels from durable store.
    patientLabelsOmitted: true,
  });
}
