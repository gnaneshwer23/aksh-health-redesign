import { NextResponse } from "next/server";

import { checkNeo4jHealth } from "../../../../lib/neo4j";
import { requireAuthenticatedUserScope } from "../../../../lib/user-scope";

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response) return auth.response;

  const health = await checkNeo4jHealth();
  return NextResponse.json(health);
}
