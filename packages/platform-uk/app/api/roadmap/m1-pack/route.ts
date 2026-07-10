import { NextResponse } from "next/server";

import { buildM1EvidencePackPayload } from "@/lib/roadmap-evidence";
import { readRoadmapState } from "@/lib/roadmap-repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope();
  if (auth.response) return auth.response;

  const { scopeKey, userId } = auth.context;
  const state = await readRoadmapState(scopeKey, userId);
  const evidence = buildM1EvidencePackPayload(state);
  const response = NextResponse.json(evidence, {
    headers: {
      "Content-Disposition": "attachment; filename=\"aksh-uk-eu-m1-evidence-pack.json\""
    }
  });

  return response;
}
