import { NextResponse } from "next/server";
import { z } from "zod";

import { errorResponse, requireActor } from "@/lib/network/http";
import { acceptStaffInvite } from "@/lib/network/service";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({
  code: z.string().trim().min(8).max(32),
  registrationNumber: z.string().trim().max(40).optional(),
  registrationBody: z.string().trim().max(120).optional(),
  professionalTitle: z.string().trim().max(80).optional(),
});

/** POST /api/invites/accept — join an organisation with a staff invite code. */
export async function POST(request: Request) {
  const actor = await requireActor();
  if (actor instanceof NextResponse) return actor;
  const limited = await checkRateLimit(`invite-accept:${actor.userId}`, 10, 15 * 60 * 1000);
  if (!limited.success) return rateLimitResponse(limited, "Too many invite attempts. Try again later.");
  try {
    return NextResponse.json(await acceptStaffInvite(actor, schema.parse(await request.json().catch(() => ({})))));
  } catch (error) {
    return errorResponse(error);
  }
}
