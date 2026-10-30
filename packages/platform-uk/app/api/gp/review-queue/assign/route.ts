/**
 * Milestone A3 — assign / reassign / escalate GP review-queue items.
 * Org + patient boundaries + audit. No autonomous clinical action.
 */
import { NextResponse } from "next/server";

import { resolveTenantContext } from "@/lib/db/tenant-context";
import {
  listReviewQueueAssignmentAudits,
  listReviewQueueAssignments,
  mutateReviewQueueAssignment,
  ReviewQueueAssignmentError,
  type ReviewQueueAssignmentAction,
} from "@/lib/gp/review-queue-assignment";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const tenant = resolveTenantContext(request, auth.context);
  const url = new URL(request.url);
  const caseId = url.searchParams.get("caseId") ?? undefined;

  const [assignments, audits] = await Promise.all([
    listReviewQueueAssignments(auth.context.scopeKey, {
      practiceId: tenant.practiceId,
      caseId,
    }),
    listReviewQueueAssignmentAudits(auth.context.scopeKey, caseId),
  ]);

  return NextResponse.json({
    assignments,
    audits: audits.slice(0, 50),
    practiceId: tenant.practiceId,
    synthetic: true,
    ehrWrite: false,
    hitlRequired: true,
  });
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const tenant = resolveTenantContext(request, auth.context);
  let body: {
    caseId?: string;
    patientId?: string | null;
    assigneeUserId?: string;
    assigneeRole?: "gp" | "clinical_reviewer" | "clinical-pharmacist" | "nurse";
    action?: ReviewQueueAssignmentAction;
    reason?: string | null;
    careEpisodeId?: string | null;
    organisationId?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body.", ehrWrite: false },
      { status: 400 }
    );
  }

  const action = body.action;
  if (!action || !["assign", "reassign", "escalate"].includes(action)) {
    return NextResponse.json(
      { error: "action must be assign | reassign | escalate", ehrWrite: false },
      { status: 400 }
    );
  }
  if (!body.caseId?.trim() || !body.assigneeUserId?.trim()) {
    return NextResponse.json(
      { error: "caseId and assigneeUserId are required", ehrWrite: false },
      { status: 400 }
    );
  }

  try {
    const result = await mutateReviewQueueAssignment({
      caseId: body.caseId.trim(),
      patientId: body.patientId ?? null,
      practiceId: tenant.practiceId,
      actorPracticeId: tenant.practiceId,
      organisationId: body.organisationId ?? null,
      scopeKey: auth.context.scopeKey,
      actorUserId: auth.context.userId,
      assigneeUserId: body.assigneeUserId.trim(),
      assigneeRole: body.assigneeRole,
      action,
      reason: body.reason,
      careEpisodeId: body.careEpisodeId ?? null,
    });

    return NextResponse.json({
      ...result,
      synthetic: true,
      ehrWrite: false,
      autonomous: false,
      hitlRequired: true,
    });
  } catch (error) {
    if (error instanceof ReviewQueueAssignmentError) {
      const status = error.code === "FORBIDDEN" ? 403 : error.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json({ error: error.message, code: error.code, ehrWrite: false }, { status });
    }
    throw error;
  }
}
