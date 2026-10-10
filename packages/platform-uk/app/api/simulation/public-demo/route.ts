import { NextResponse } from "next/server";
import { z } from "zod";

import { isSimulationRequest } from "@/lib/env/simulation";
import { errorResponse } from "@/lib/network/http";
import { setPublicDemo } from "@/lib/network/service";

export const dynamic = "force-dynamic";

/** POST /api/simulation/public-demo — scenario runner only; refused in production and without the runner token. */
export async function POST(request: Request) {
  if (!isSimulationRequest(request)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const { orgIds } = z.object({ orgIds: z.array(z.string().min(1).max(64)).max(20) }).parse(await request.json());
    await setPublicDemo(orgIds, null);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
