import { NextResponse } from "next/server";

import { buildEvidenceArtifactRegistry } from "@/lib/evidence-artifact-registry";
import { readReviewCases } from "@/lib/review-case-repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope();
  if (auth.response) return auth.response;

  const { scopeKey } = auth.context;
  const cases = await readReviewCases(scopeKey);
  const registry = buildEvidenceArtifactRegistry(cases);
  const response = NextResponse.json(registry, {
    headers: {
      "Content-Disposition": "attachment; filename=\"aksh-uk-eu-evidence-artifact-registry.json\""
    }
  });

  return response;
}
