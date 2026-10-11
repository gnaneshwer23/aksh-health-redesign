import { NextResponse } from "next/server";
import { z } from "zod";

import { confirmEnrolment, disableMfa, mfaStatus, startEnrolment } from "@/lib/auth/mfa";
import { audit, withPrivileged } from "@/lib/network/db";
import { errorResponse, requireActor } from "@/lib/network/http";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start") }),
  z.object({ action: z.literal("confirm"), code: z.string().trim().min(6).max(20) }),
  z.object({ action: z.literal("disable"), code: z.string().trim().min(6).max(20) }),
]);

const MESSAGES: Record<string, [number, string]> = {
  ALREADY_ENABLED: [409, "Two-step sign-in is already on."],
  NO_PENDING_ENROLMENT: [409, "Start again: set-up has expired or was not started."],
  INVALID_CODE: [400, "That code didn't work. Check the time on your phone and use the newest code."],
};

/** GET /api/me/mfa — whether two-step sign-in is on. */
export async function GET() {
  const actor = await requireActor();
  if (actor instanceof NextResponse) return actor;
  try {
    return NextResponse.json(await mfaStatus(actor.userId));
  } catch (error) {
    return errorResponse(error, "/api/me/mfa");
  }
}

/** POST /api/me/mfa — start set-up, confirm with a first code (returns recovery codes once), or turn it off. */
export async function POST(request: Request) {
  const actor = await requireActor();
  if (actor instanceof NextResponse) return actor;
  const limited = await checkRateLimit(`mfa:${actor.userId}`, 10, 15 * 60 * 1000);
  if (!limited.success) return rateLimitResponse(limited, "Too many attempts. Wait 15 minutes.");
  try {
    const input = schema.parse(await request.json().catch(() => ({})));
    const result =
      input.action === "start" ? await startEnrolment(actor.userId, actor.email)
      : input.action === "confirm" ? await confirmEnrolment(actor.userId, input.code)
      : (await disableMfa(actor.userId, input.code), { disabled: true });
    if (input.action !== "start") {
      await withPrivileged((c) => audit(c, { actorUserId: actor.userId, action: input.action === "confirm" ? "mfa.enabled" : "mfa.disabled", resourceType: "user", resourceId: actor.userId }));
    }
    return NextResponse.json(result);
  } catch (error) {
    const known = error instanceof Error ? MESSAGES[error.message] : undefined;
    if (known) return NextResponse.json({ error: known[1] }, { status: known[0] });
    return errorResponse(error, "/api/me/mfa");
  }
}
