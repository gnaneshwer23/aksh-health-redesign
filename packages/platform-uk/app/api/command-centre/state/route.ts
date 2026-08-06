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

  // OQ-PER-1/OQ-PER-2: command-centre state is a clinical/ops evidence export — patient,
  // researcher, and unrecognized ("restricted") AppRoles must not reach it now that they no
  // longer fall through to clinical_reviewer.
  if (userRole !== "clinical_reviewer" && userRole !== "operations_lead") {
    return NextResponse.json({ error: "Forbidden. Clinical or operations role required." }, { status: 403 });
  }

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
