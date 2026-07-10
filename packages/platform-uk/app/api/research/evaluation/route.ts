import { NextResponse } from "next/server";

import { buildResearchEvaluationArtifact } from "../../../../lib/research-evaluation-plan";
import { requireAuthenticatedUserScope } from "../../../../lib/user-scope";

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response) return auth.response;

  const { userEmail, scopeKey } = auth.context;
  const generatedBy = userEmail || scopeKey;
  const artifact = buildResearchEvaluationArtifact({ generatedBy });
  const response = NextResponse.json(artifact, {
    headers: {
      "Content-Disposition": "attachment; filename=\"aksh-uk-eu-research-evaluation-boundary.json\""
    }
  });

  return response;
}
