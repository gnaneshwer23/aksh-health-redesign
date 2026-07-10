import { NextResponse } from "next/server";

import { readBenchmarkSignoffState } from "../../../../lib/benchmark-signoff-repository";
import { readFeedbackState } from "../../../../lib/feedback-repository";
import { buildEvidenceReadinessPayload } from "../../../../lib/readiness-evidence";
import { readReviewCases } from "../../../../lib/review-case-repository";
import { requireAuthenticatedUserScope } from "../../../../lib/user-scope";

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response) return auth.response;

  const { scopeKey, userId } = auth.context;
  const [cases, feedbackState, signoffState] = await Promise.all([
    readReviewCases(scopeKey),
    readFeedbackState(scopeKey, userId),
    readBenchmarkSignoffState(scopeKey, userId)
  ]);
  const payload = buildEvidenceReadinessPayload(cases, feedbackState.archive, signoffState.archive[0]);
  const response = NextResponse.json(payload, {
    headers: {
      "Content-Disposition": "attachment; filename=\"aksh-uk-eu-evidence-readiness.json\""
    }
  });

  return response;
}
