import { NextResponse } from "next/server";

import { getTwinSimulationStatus } from "@/lib/precision-health/twin-simulation";

export const maxDuration = 30;

/**
 * GET /api/precision-health/twin/status
 * Explicit honesty endpoint for synthetic scenario ranking availability.
 */
export async function GET() {
  return NextResponse.json(getTwinSimulationStatus());
}
