import { NextResponse } from "next/server";

import { retryShieldAuditForLearningEvent } from "@/lib/repositories/learning-event-repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const dynamic = "force-dynamic";

/**
 * POST /api/clinical-spine/shield-audit-retry
 * Fail-visible retry path for OQ-HITL-2: re-attempts the SHIELD durable audit
 * write for a learning event whose original dual write failed. The underlying
 * clinical decision (Accept/Edit/Reject) already completed — this only retries
 * the audit mirror. Never blocks or re-runs the clinical action itself.
 */
export async function POST(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  let body: { learningEventId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const learningEventId = body.learningEventId?.trim();
  if (!learningEventId) {
    return NextResponse.json({ error: "learningEventId is required." }, { status: 400 });
  }

  const result = await retryShieldAuditForLearningEvent(learningEventId, {
    scopeKey: auth.context.scopeKey
  });

  if (!result.ok) {
    return NextResponse.json(
      { retried: false, learningEventId, reason: result.reason },
      { status: 503 }
    );
  }

  return NextResponse.json({ retried: true, learningEventId });
}
