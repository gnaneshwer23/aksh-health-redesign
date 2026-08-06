import { NextResponse } from "next/server";

import { deriveDashboardSummary } from "@/lib/dashboard-summary";
import { readFeedbackState } from "@/lib/feedback-repository";
import { readReviewCases } from "@/lib/review-case-repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope();
  if (auth.response) return auth.response;

  const { scopeKey, userId, userRole } = auth.context;

  // OQ-PER-1/OQ-PER-2: this is a clinical/ops review-queue dashboard — patient,
  // researcher, and unrecognized ("restricted") AppRoles must not reach it now
  // that they no longer fall through to clinical_reviewer.
  if (userRole !== "clinical_reviewer" && userRole !== "operations_lead") {
    return NextResponse.json({ error: "Forbidden. Clinical or operations role required." }, { status: 403 });
  }

  const [cases, feedbackState] = await Promise.all([
    readReviewCases(scopeKey),
    readFeedbackState(scopeKey, userId)
  ]);

  const summary = deriveDashboardSummary(cases, feedbackState.archive, userRole);
  return NextResponse.json({ summary });
}
