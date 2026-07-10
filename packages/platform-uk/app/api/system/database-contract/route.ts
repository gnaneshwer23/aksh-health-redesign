import { NextResponse } from "next/server";

import { buildDatabaseAdapterContract } from "../../../../lib/system-contracts";
import { requireAuthenticatedUserScope } from "../../../../lib/user-scope";

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response) return auth.response;

  const { scopeKey, userEmail } = auth.context;
  const artifact = {
    ...buildDatabaseAdapterContract(),
    generatedBy: userEmail || scopeKey,
    generatedAt: new Date().toISOString()
  };
  const response = NextResponse.json(artifact, {
    headers: {
      "Content-Disposition": "attachment; filename=\"aksh-uk-eu-database-adapter-contract.json\""
    }
  });

  return response;
}
