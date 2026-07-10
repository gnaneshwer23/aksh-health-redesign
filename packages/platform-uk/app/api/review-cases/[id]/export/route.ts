import { NextResponse } from "next/server";

import { readReviewCaseById } from "../../../../../lib/review-case-repository";
import { requireAuthenticatedUserScope } from "../../../../../lib/user-scope";
import { buildEvidencePayload } from "../../../../../lib/workflow";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response) return auth.response;

  const { scopeKey, userId } = auth.context;
  const reviewCase = await readReviewCaseById(params.id, scopeKey, userId);

  if (!reviewCase) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  // Ownership validation
  if (reviewCase.userId && reviewCase.userId !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const response = NextResponse.json(buildEvidencePayload(reviewCase), {
    headers: {
      "Content-Disposition": `attachment; filename="${params.id}-evidence.json"`
    }
  });

  return response;
}
