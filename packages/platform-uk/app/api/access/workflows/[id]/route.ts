import { NextResponse } from "next/server";

import { getWorkflow } from "@/lib/access/service";
import { errorResponse, requireContext } from "@/lib/network/http";

export const dynamic = "force-dynamic";

/** GET /api/access/workflows/:id — slot, ranked candidates with reasons, action history and hand-offs. */
export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const r = await requireContext();
  if (r instanceof NextResponse) return r;
  try {
    const wf = await getWorkflow(r.ctx, params.id.slice(0, 64));
    return wf ? NextResponse.json(wf) : NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    return errorResponse(error);
  }
}
