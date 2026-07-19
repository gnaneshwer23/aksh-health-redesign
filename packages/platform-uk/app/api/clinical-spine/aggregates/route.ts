import { NextResponse } from "next/server";

import { buildSpineAggregates } from "@/lib/clinical-spine/role-events";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const dynamic = "force-dynamic";

/**
 * GET /api/clinical-spine/aggregates
 * ICS / hospital views of the same spine stores as GP timeline — not parallel fake data.
 */
export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const url = new URL(request.url);
  const rawIds = url.searchParams.get("patientIds");
  const patientIds = rawIds
    ? rawIds
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
    : undefined;

  const aggregates = await buildSpineAggregates({
    scopeKey: auth.context.scopeKey,
    patientIds
  });

  return NextResponse.json(aggregates);
}
