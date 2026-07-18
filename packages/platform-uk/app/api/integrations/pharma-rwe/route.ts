import { NextResponse } from "next/server";

import { getPharmaRweSummary } from "@/lib/precision-health/pharma-payer";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

/**
 * GET /api/integrations/pharma-rwe
 * Read-only RWE summary placeholder — not a live pharma integration.
 */
export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  return NextResponse.json(getPharmaRweSummary());
}
