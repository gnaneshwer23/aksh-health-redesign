import { NextResponse } from "next/server";

import { buildDatabaseAdapterContract } from "../../../../lib/system-contracts";
import { resolveOptionalAuthenticatedUserScope } from "../../../../lib/user-scope";

export async function GET(request: Request) {
  const context = await resolveOptionalAuthenticatedUserScope(request);
  const generatedBy = context?.userEmail || context?.scopeKey || "public";
  const artifact = {
    ...buildDatabaseAdapterContract(),
    generatedBy,
    generatedAt: new Date().toISOString()
  };
  const response = NextResponse.json(artifact, {
    headers: {
      "Content-Disposition": "attachment; filename=\"aksh-uk-eu-database-adapter-contract.json\""
    }
  });

  return response;
}
