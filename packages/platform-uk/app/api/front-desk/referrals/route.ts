import { NextResponse } from "next/server";
import { z } from "zod";

import { withDeskDirectory } from "@/lib/front-desk/directory";
import { mutateState } from "@/lib/front-desk/store";
import { confirmReferralBooking, intakeReferral } from "@/lib/front-desk/workflows";

export const dynamic = "force-dynamic";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("intake"), text: z.string().min(10).max(5000) }),
  z.object({ action: z.literal("confirm"), id: z.string().max(80) }),
]);

/** POST /api/front-desk/referrals — Referral Desk on the synthetic practice. Urgent referrals go to a clinician first. */
async function handlePOST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Paste a referral letter (at least a few words)." }, { status: 400 });
  if (parsed.data.action === "intake") {
    const text = parsed.data.text;
    const { result } = await mutateState((s) => intakeReferral(s, text));
    return NextResponse.json({ referral: result });
  }
  const id = parsed.data.id;
  const { result } = await mutateState((s) => confirmReferralBooking(s, id));
  if (!result) return NextResponse.json({ error: "That referral can’t be booked (already booked, urgent, or slot taken)." }, { status: 409 });
  return NextResponse.json({ referral: result });
}

/** Patients come from this request's database directory (see lib/front-desk/directory.ts). */
export async function POST(request: Request) {
  return withDeskDirectory(() => handlePOST(request));
}
