import { NextResponse } from "next/server";

import { buildCommandCentreStatePayload } from "@/lib/command-centre-evidence";
import { deriveDashboardSummary } from "@/lib/dashboard-summary";
import { readFeedbackState } from "@/lib/feedback-repository";
import { readReviewCases } from "@/lib/review-case-repository";
import { readRoadmapState } from "@/lib/roadmap-repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope();
  if (auth.response) return auth.response;

  const { scopeKey, userId, userRole } = auth.context;
  const [cases, feedbackState, roadmapState] = await Promise.all([
    readReviewCases(scopeKey),
    readFeedbackState(scopeKey, userId),
    readRoadmapState(scopeKey, userId)
  ]);
  const dashboard = deriveDashboardSummary(cases, feedbackState.archive, userRole);
  const evidence = buildCommandCentreStatePayload(dashboard, roadmapState);
  const response = NextResponse.json(evidence, {
    headers: {
      "Content-Disposition": "attachment; filename=\"aksh-uk-eu-command-centre-product-state.json\""
    }
  });

  return response;
}
