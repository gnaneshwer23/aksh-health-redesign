import { NextResponse } from "next/server";

import { listRegisteredModels, persistModelRegistrySnapshot } from "@/lib/model-registry";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const persist = await persistModelRegistrySnapshot();
  return NextResponse.json({
    liveEmis: false,
    persist,
    models: listRegisteredModels(),
  });
}
