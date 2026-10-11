import { NextResponse } from "next/server";

import { reviewItem, reviewItemSchema } from "@/lib/golive/service";
import { errorResponse, requireActor } from "@/lib/network/http";

export const dynamic = "force-dynamic";

/** POST /api/platform/go-live/:orgId/items/:key — accept or reject submitted evidence. */
export async function POST(
  request: Request,
  props: { params: Promise<{ orgId: string; key: string }> }
) {
  const params = await props.params;
  try {
    const actor = await requireActor();
    if (actor instanceof NextResponse) return actor;
    return NextResponse.json(await reviewItem(actor.userId, params.orgId, params.key, reviewItemSchema.parse(await request.json().catch(() => ({})))));
  } catch (error) {
    return errorResponse(error, "/api/platform/go-live/:orgId/items/:key");
  }
}
