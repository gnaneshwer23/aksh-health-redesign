import { NextResponse } from "next/server";

import { buildIntegrationBoundaryContract } from "../../../../lib/integration-boundary-contract";
import { resolveOptionalAuthenticatedUserScope } from "../../../../lib/user-scope";

export async function GET(request: Request) {
  const context = await resolveOptionalAuthenticatedUserScope(request);
  const contract = buildIntegrationBoundaryContract({
    generatedBy: context?.userEmail ?? context?.scopeKey ?? "public"
  });

  return NextResponse.json(contract, {
    headers: {
      "Content-Disposition": "attachment; filename=\"aksh-uk-eu-integration-boundary-contract.json\""
    }
  });
}
