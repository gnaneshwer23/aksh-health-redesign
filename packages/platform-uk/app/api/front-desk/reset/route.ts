import { NextResponse } from "next/server";

import { getOptionalAuthenticatedUserScope } from "@/lib/front-desk/auth";
import { resetState } from "@/lib/front-desk/store";

export const dynamic = "force-dynamic";

/** POST /api/front-desk/reset — reset the synthetic practice. Signed-in GP or practice manager only. */
export async function POST(request: Request) {
  const auth = await getOptionalAuthenticatedUserScope(request);
  if (!auth || !(auth.clinicalPersona === "gp" || auth.userRole === "operations_lead")) {
    return NextResponse.json({ error: "Sign in as a GP or practice manager to reset the demo practice." }, { status: 403 });
  }
  const storage = await resetState();
  return NextResponse.json({ reset: true, storage });
}
