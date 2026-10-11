import { NextResponse } from "next/server";

import { buildCaseValidationDossierPayload } from "../../../../../lib/case-dossier-evidence";
import { readFeedbackEntriesForCase } from "../../../../../lib/feedback-repository";
import { readReviewCaseById, readReviewCases } from "../../../../../lib/review-case-repository";
import { requireAuthenticatedUserScope } from "../../../../../lib/user-scope";

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response) return auth.response;

  const { scopeKey, userId, userEmail } = auth.context;
  const [reviewCase, allCases, linkedFeedback] = await Promise.all([
    readReviewCaseById(params.id, scopeKey, userId),
    readReviewCases(scopeKey),
    readFeedbackEntriesForCase(params.id, scopeKey, userId)
  ]);

  if (!reviewCase) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  if (reviewCase.userId && reviewCase.userId !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const payload = buildCaseValidationDossierPayload(reviewCase, allCases, {
    generatedBy: userEmail ?? undefined,
    linkedFeedback,
    scopeKey
  });

  return NextResponse.json(payload, {
    headers: {
      "Content-Disposition": `attachment; filename="${params.id}-validation-dossier.json"`
    }
  });
}
