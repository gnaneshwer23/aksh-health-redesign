import { NextResponse } from "next/server";

import { buildRoadmapEvidencePayload } from "@/lib/roadmap-evidence";
import { readRoadmapState } from "@/lib/roadmap-repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope();
  if (auth.response) return auth.response;

  const { scopeKey, userId } = auth.context;
  const state = await readRoadmapState(scopeKey, userId);
  const evidence = buildRoadmapEvidencePayload(state);
  const response = NextResponse.json(evidence, {
    headers: {
      "Content-Disposition": "attachment; filename=\"aksh-uk-eu-roadmap-evidence.json\""
    }
  });

  return response;
}
