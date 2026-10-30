import { NextResponse } from "next/server";
import { z } from "zod";

import { correlateCareEpisodeStage, readCareEpisodeId } from "@/lib/care-episode";
import { getOptionalAuthenticatedUserScope } from "@/lib/front-desk/auth";
import { withDeskDirectory } from "@/lib/front-desk/directory";
import { listOpenNurseObservationTasks } from "@/lib/front-desk/nurse-handoff";
import { mutateState } from "@/lib/front-desk/store";
import { confirmReferralBooking, intakeReferral } from "@/lib/front-desk/workflows";

export const dynamic = "force-dynamic";

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("intake"),
    text: z.string().min(10).max(5000),
    careEpisodeId: z.string().max(80).optional(),
    care_episode_id: z.string().max(80).optional(),
  }),
  z.object({
    action: z.literal("confirm"),
    id: z.string().max(80),
    careEpisodeId: z.string().max(80).optional(),
    care_episode_id: z.string().max(80).optional(),
  }),
]);

/** POST /api/front-desk/referrals — Referral Desk on the synthetic practice. Urgent referrals go to a clinician first. */
async function handlePOST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Paste a referral letter (at least a few words)." }, { status: 400 });
  if (parsed.data.action === "intake") {
    const text = parsed.data.text;
    const requestedEpisode = readCareEpisodeId(parsed.data);
    const { result } = await mutateState((s) =>
      intakeReferral(s, text, new Date().toISOString(), { careEpisodeId: requestedEpisode })
    );
    return NextResponse.json({
      referral: result,
      careEpisodeId: result.careEpisodeId ?? null,
      verifiedPatient: result.verifiedPatient ?? null,
      intakeSummary: result.intakeSummary ?? null,
    });
  }

  const auth = await getOptionalAuthenticatedUserScope(request);
  const actor = auth?.userEmail ?? auth?.userId ?? "front-desk-demo";
  const scopeKey = auth?.scopeKey ?? "shared";
  const requestedEpisode = readCareEpisodeId(parsed.data);

  const id = parsed.data.id;
  const { result, state } = await mutateState((s) =>
    confirmReferralBooking(s, id, { careEpisodeId: requestedEpisode })
  );
  if (!result) {
    return NextResponse.json(
      { error: "That referral can’t be booked (already booked, urgent, or slot taken)." },
      { status: 409 }
    );
  }

  let careEpisodeId = requestedEpisode ?? result.careEpisodeId ?? undefined;
  if (result.patientId && result.proposedSlotId) {
    const correlated = await correlateCareEpisodeStage({
      patientId: result.patientId,
      actor,
      scopeKey,
      careEpisodeId,
      stage: "booking",
      linkId: result.proposedSlotId,
      linkLabel: "Referral Desk booking",
    });
    careEpisodeId = correlated.careEpisodeId;

    await mutateState((s) => {
      const slot = s.slots.find((x) => x.id === result.proposedSlotId);
      if (slot) slot.careEpisodeId = careEpisodeId;
      for (const w of listOpenNurseObservationTasks(s)) {
        if (w.patientId !== result.patientId) continue;
        w.careEpisodeId = careEpisodeId;
        if (careEpisodeId && !w.summary.includes(careEpisodeId)) {
          w.summary = `${w.summary} · episode ${careEpisodeId}`;
        }
      }
      return true;
    });
  }

  return NextResponse.json({
    referral: result,
    careEpisodeId: careEpisodeId ?? null,
    verifiedPatient: result.verifiedPatient ?? null,
    intakeSummary: result.intakeSummary ?? null,
    nurseObservationOpen: listOpenNurseObservationTasks(state).some((w) => w.patientId === result.patientId),
  });
}

/** Patients come from this request's database directory (see lib/front-desk/directory.ts). */
export async function POST(request: Request) {
  return withDeskDirectory(() => handlePOST(request));
}
