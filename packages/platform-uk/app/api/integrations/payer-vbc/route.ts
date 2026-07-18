import { NextResponse } from "next/server";

import { getPayerVbcMetrics } from "@/lib/precision-health/pharma-payer";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

/**
 * GET /api/integrations/payer-vbc
 * Read-only value-based care metrics placeholder — not a live payer integration.
 */
export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  return NextResponse.json(getPayerVbcMetrics());
}
