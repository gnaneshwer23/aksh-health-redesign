import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { resolvePatientBinding } from "@/lib/onboarding/patient-binding";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const schema = z.object({
  inviteCode: z.string().trim().min(1).max(32),
  dateOfBirth: z.string().trim().max(10),
});

/** Check a clinic invite code during onboarding. Returns only the status, never the record. */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const limited = checkRateLimit(`onboarding-invite:${session.user.id}`, 10, 15 * 60 * 1000);
  if (!limited.success) {
    return rateLimitResponse(limited, "Too many invite code attempts. Ask your clinic to confirm the code, then retry later.");
  }
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ status: "rejected", reason: "unknown-code" }, { status: 400 });
  }
  const binding = await resolvePatientBinding(session.user.id, session.user.email, parsed.data, { consume: false });
  if (binding.status === "linked") return NextResponse.json({ status: "linked" });
  if (binding.status === "none") return NextResponse.json({ status: "none" });
  // Same message for unknown code and mismatched details so the endpoint cannot be used to probe codes.
  return NextResponse.json({ status: "rejected" });
}
