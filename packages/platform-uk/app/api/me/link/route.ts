import { NextResponse } from "next/server";
import { z } from "zod";

import { mergeProfilePreferences } from "@/lib/auth/user-repository";
import { withPrivileged } from "@/lib/network/db";
import { errorResponse, requireActor } from "@/lib/network/http";
import { acceptPatientInvite } from "@/lib/network/service";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({ code: z.string().trim().min(8).max(32), dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

/**
 * POST /api/me/link — a patient who signed up without a code links their clinic later. Code AND date of birth must
 * match; the invite is single use. Readings recorded before stay on the account until the patient shares them.
 */
export async function POST(request: Request) {
  const actor = await requireActor();
  if (actor instanceof NextResponse) return actor;
  if (actor.role !== "patient") return NextResponse.json({ error: "Patient accounts only" }, { status: 403 });
  const limited = checkRateLimit(`patient-link:${actor.userId}`, 5, 15 * 60 * 1000);
  if (!limited.success) return rateLimitResponse(limited, "Too many attempts. Try again later or ask your clinic for a new code.");
  try {
    const input = schema.parse(await request.json().catch(() => ({})));
    // A retry after a half-finished link (record linked, profile not yet updated) completes it instead of failing.
    const existing = await withPrivileged(async (c) =>
      (await c.query<{ patient_id: string; organisation_id: string }>(
        `SELECT a.patient_id, p.organisation_id FROM aksh.patient_accounts a JOIN aksh.network_patients p ON p.id = a.patient_id WHERE a.user_id = $1`,
        [actor.userId]
      )).rows[0]
    );
    const linked = existing
      ? { patientId: existing.patient_id, organisationId: existing.organisation_id }
      : await acceptPatientInvite({ userId: actor.userId, email: actor.email }, input);
    await mergeProfilePreferences(actor.userId, { boundPatientId: linked.patientId, networkPatientId: linked.patientId, boundOrganisationId: linked.organisationId, inviteStatus: "linked" });
    return NextResponse.json({ linked: true, patientId: linked.patientId });
  } catch (error) {
    return errorResponse(error, "/api/me/link");
  }
}
