import { NextResponse } from "next/server";

import { buildIntegrationBoundaryContract } from "../../../../lib/integration-boundary-contract";
import { requireAuthenticatedUserScope } from "../../../../lib/user-scope";

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response) return auth.response;

  const contract = buildIntegrationBoundaryContract({
    generatedBy: auth.context.userEmail ?? undefined
  });

  return NextResponse.json(contract, {
    headers: {
      "Content-Disposition": "attachment; filename=\"aksh-uk-eu-integration-boundary-contract.json\""
    }
  });
}
