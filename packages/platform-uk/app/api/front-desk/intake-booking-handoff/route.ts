import { NextResponse } from "next/server";
import { z } from "zod";

import { correlateCareEpisodeStage, readCareEpisodeId } from "@/lib/care-episode";
import { getOptionalAuthenticatedUserScope } from "@/lib/front-desk/auth";
import { withDeskDirectory } from "@/lib/front-desk/directory";
import {
  openIntakeBookingWorkItem,
  verifiedPatientFromId,
} from "@/lib/front-desk/intake-booking-handoff";
import { mutateState } from "@/lib/front-desk/store";

export const dynamic = "force-dynamic";

const schema = z.object({
  patientId: z.string().min(1).max(80),
  reviewCaseId: z.string().max(80).optional(),
  reason: z.string().max(500).optional(),
  careEpisodeId: z.string().max(80).optional(),
  care_episode_id: z.string().max(80).optional(),
});

/**
 * POST /api/front-desk/intake-booking-handoff
 * After classic intake creates a review case + care episode, open a Front Desk
 * booking work item carrying verified identity so reception does not re-enter.
 */
async function handlePOST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "patientId required for intake→booking handoff." },
      { status: 400 }
    );
  }

  const auth = await getOptionalAuthenticatedUserScope(request);
  const actor = auth?.userEmail ?? auth?.userId ?? "front-desk-demo";
  const scopeKey = auth?.scopeKey ?? "shared";
  const patientId = parsed.data.patientId.trim();
  const verified = verifiedPatientFromId(patientId);
  if (!verified) {
    return NextResponse.json(
      { error: "Patient not found in Front Desk directory (synthetic cohort only)." },
      { status: 404 }
    );
  }

  const correlated = await correlateCareEpisodeStage({
    patientId,
    patientLabel: verified.name,
    actor,
    scopeKey,
    careEpisodeId: readCareEpisodeId(parsed.data) ?? undefined,
    stage: "intake",
    linkId: parsed.data.reviewCaseId ?? `intake-book-${patientId}`,
    linkLabel: "Intake → Front Desk booking handoff",
  });

  const { result } = await mutateState((s) =>
    openIntakeBookingWorkItem(s, {
      careEpisodeId: correlated.careEpisodeId,
      patientId,
      verifiedPatient: verified,
      intakeSummary: `${verified.name} · DOB ${verified.dob} · ${parsed.data.reason?.trim() || "intake booking"}`,
      reviewCaseId: parsed.data.reviewCaseId ?? null,
      reason: parsed.data.reason ?? null,
    })
  );

  return NextResponse.json({
    workItem: result,
    careEpisodeId: correlated.careEpisodeId,
    verifiedPatient: verified,
    ehrWrite: false,
    note: "Reception can book from verified identity + care_episode_id without re-entry.",
  });
}

export async function POST(request: Request) {
  return withDeskDirectory(() => handlePOST(request));
}
