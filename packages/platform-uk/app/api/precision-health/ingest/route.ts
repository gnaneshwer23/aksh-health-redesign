import { NextResponse } from "next/server";

import { runIngestionPipeline } from "@/lib/precision-health/ingestion-pipeline";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

/**
 * POST /api/precision-health/ingest
 * Consent-gated connector ingest → store → optional Neo4j MERGE → SHIELD.
 * Never invents live device streams; ehrWrite always false.
 */
export async function POST(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body.", liveStream: false }, { status: 400 });
  }

  try {
    const result = await runIngestionPipeline(body, {
      scopeKey: auth.context.scopeKey,
      actor: auth.context.userEmail ?? auth.context.userId
    });

    return NextResponse.json(result, { status: result.accepted ? 200 : 403 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Ingest failed.",
        liveStream: false,
        ehrWrite: false
      },
      { status: 400 }
    );
  }
}
