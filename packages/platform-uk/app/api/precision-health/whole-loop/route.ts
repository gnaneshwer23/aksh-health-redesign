import { NextResponse } from "next/server";

import {
  getWholeLoopCapabilities,
  runWholeLoop
} from "@/lib/precision-health/whole-loop";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 60;

const PUBLIC_DEMO_LIMIT = { limit: 5, windowMs: 60_000 };

/**
 * GET /api/precision-health/whole-loop
 * Capabilities + honesty flags (public).
 */
export async function GET() {
  return NextResponse.json(getWholeLoopCapabilities());
}

/**
 * POST /api/precision-health/whole-loop
 * Run synthetic Precision Health whole loop.
 *
 * - Authenticated: any cohort patient (P001–P100); optional demoAccept
 * - Unauthenticated public demo: P001 only, rate-limited, synthetic-only
 */
export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    const parsed = await request.json();
    if (parsed && typeof parsed === "object") {
      body = parsed as Record<string, unknown>;
    }
  } catch {
    body = {};
  }

  const patientId =
    typeof body.patientId === "string" && body.patientId.trim()
      ? body.patientId.trim()
      : "P001";
  const publicDemo = body.publicDemo === true;
  const demoAccept = body.demoAccept === true;

  const auth = await requireAuthenticatedUserScope(request);

  if (auth.context) {
    try {
      const report = await runWholeLoop(
        {
          patientId,
          publicDemo: false,
          demoAccept,
          includeCausal: true,
          includeCoaching: true,
          updateKg: true
        },
        {
          scopeKey: auth.context.scopeKey,
          actor: auth.context.userEmail ?? auth.context.userId,
          mode: "authenticated"
        }
      );
      return NextResponse.json(report);
    } catch (error) {
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : "Whole-loop run failed.",
          physiologicalTwin: false,
          liveEmis: false,
          ehrWrite: false
        },
        { status: 400 }
      );
    }
  }

  // Unauthenticated — public demo only (P001)
  if (patientId !== "P001" && !publicDemo) {
    return (
      auth.response ??
      NextResponse.json(
        { error: "Authentication required for patients other than P001.", liveEmis: false },
        { status: 401 }
      )
    );
  }

  const ip = getClientIp(request);
  const limited = checkRateLimit(
    `whole-loop-demo:${ip}`,
    PUBLIC_DEMO_LIMIT.limit,
    PUBLIC_DEMO_LIMIT.windowMs
  );
  if (!limited.success) {
    return rateLimitResponse(
      limited,
      "Public whole-loop demo rate limit exceeded. Sign in for authenticated runs, or retry shortly."
    );
  }

  try {
    const report = await runWholeLoop(
      {
        patientId: "P001",
        publicDemo: true,
        demoAccept,
        includeCausal: true,
        includeCoaching: true,
        updateKg: true
      },
      {
        scopeKey: "public_demo_whole_loop",
        actor: "public-demo@aksh.health",
        mode: "public_demo"
      }
    );
    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Whole-loop run failed.",
        physiologicalTwin: false,
        liveEmis: false,
        ehrWrite: false
      },
      { status: 400 }
    );
  }
}
