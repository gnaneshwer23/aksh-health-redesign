import { NextResponse } from "next/server";

import { readBenchmarkSignoffState } from "@/lib/benchmark-signoff-repository";
import { readFeedbackState } from "@/lib/feedback-repository";
import { buildEvidenceReadinessPayload } from "@/lib/readiness-evidence";
import {
  readEvidenceReadinessHistory,
  saveEvidenceReadinessSnapshot
} from "@/lib/readiness-history-repository";
import { readReviewCases } from "@/lib/review-case-repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

async function buildCurrentPayload(scopeKey: string, userId: string) {
  const [cases, feedbackState, signoffState] = await Promise.all([
    readReviewCases(scopeKey),
    readFeedbackState(scopeKey, userId),
    readBenchmarkSignoffState(scopeKey, userId)
  ]);

  return buildEvidenceReadinessPayload(cases, feedbackState.archive, signoffState.archive[0]);
}

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope();
  if (auth.response) return auth.response;

  const { scopeKey, userId } = auth.context;
  const state = await readEvidenceReadinessHistory(scopeKey, userId);
  return NextResponse.json({ state });
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUserScope();
  if (auth.response) return auth.response;

  const { scopeKey, userId } = auth.context;
  const payload = await buildCurrentPayload(scopeKey, userId);
  const state = await saveEvidenceReadinessSnapshot(payload, scopeKey, userId);
  return NextResponse.json({ state });
}
