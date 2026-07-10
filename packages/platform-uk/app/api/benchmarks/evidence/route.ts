import { NextResponse } from "next/server";

import { buildBenchmarkEvidencePayload } from "../../../../lib/benchmark-evidence";
import { readBenchmarkSignoffState } from "../../../../lib/benchmark-signoff-repository";
import { readReviewCases } from "../../../../lib/review-case-repository";
import { requireAuthenticatedUserScope } from "../../../../lib/user-scope";

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response) return auth.response;

  const { scopeKey, userId } = auth.context;
  const cases = await readReviewCases(scopeKey);
  const signoffState = await readBenchmarkSignoffState(scopeKey, userId);
  const evidence = buildBenchmarkEvidencePayload(cases);
  const response = NextResponse.json({ ...evidence, signoff: signoffState.archive[0] ?? null }, {
    headers: {
      "Content-Disposition": "attachment; filename=\"aksh-uk-eu-benchmark-evidence.json\""
    }
  });

  return response;
}
