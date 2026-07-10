import { NextResponse } from "next/server";

import { deriveDashboardSummary } from "@/lib/dashboard-summary";
import { readFeedbackState } from "@/lib/feedback-repository";
import { readReviewCases } from "@/lib/review-case-repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope();
  if (auth.response) return auth.response;

  const { scopeKey, userId, userRole } = auth.context;

  const [cases, feedbackState] = await Promise.all([
    readReviewCases(scopeKey),
    readFeedbackState(scopeKey, userId)
  ]);

  const summary = deriveDashboardSummary(cases, feedbackState.archive, userRole);
  return NextResponse.json({ summary });
}
