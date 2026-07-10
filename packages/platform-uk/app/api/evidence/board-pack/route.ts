import { NextResponse } from "next/server";

import { buildBoardPackEvidencePayload } from "../../../../lib/board-pack-evidence";
import { readBenchmarkSignoffState } from "../../../../lib/benchmark-signoff-repository";
import { readFeedbackState } from "../../../../lib/feedback-repository";
import { readEvidenceReadinessHistory } from "../../../../lib/readiness-history-repository";
import { readReviewCases } from "../../../../lib/review-case-repository";
import { requireAuthenticatedUserScope } from "../../../../lib/user-scope";

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response) return auth.response;

  const { scopeKey, userId, userEmail } = auth.context;
  const [cases, feedbackState, signoffState, readinessHistory] = await Promise.all([
    readReviewCases(scopeKey),
    readFeedbackState(scopeKey, userId),
    readBenchmarkSignoffState(scopeKey, userId),
    readEvidenceReadinessHistory(scopeKey, userId)
  ]);

  const payload = buildBoardPackEvidencePayload(
    cases,
    feedbackState.archive,
    signoffState.archive[0],
    readinessHistory.archive,
    {
      generatedBy: userEmail ?? undefined,
      scopeKey
    }
  );

  return NextResponse.json(payload, {
    headers: {
      "Content-Disposition": "attachment; filename=\"aksh-uk-eu-board-pack-evidence.json\""
    }
  });
}
