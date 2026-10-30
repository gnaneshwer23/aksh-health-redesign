import { NextResponse } from "next/server";

import { withDeskDirectory } from "@/lib/front-desk/directory";
import { buildNurseObservationWorklist } from "@/lib/front-desk/nurse-handoff";
import { loadState } from "@/lib/front-desk/store";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * GET /api/nurse/observation-worklist — P2 nurse visibility for booking→nurse handoff.
 * Surfaces open `nurse_observation` Front Desk work items (with care_episode_id when set).
 * Synthetic practice data only; no EHR write.
 */
async function handleGET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const { state, storage } = await loadState();
  const items = buildNurseObservationWorklist(state);

  return NextResponse.json(
    {
      items,
      count: items.length,
      storage,
      roleFilter: "nurse",
      synthetic: true,
      ehrWrite: false,
      autonomousClinicalAction: false,
      note:
        "P2 nurse observation worklist from verified Front Desk bookings. Tasks carry care_episode_id when correlated. HITL vitals via POST /api/clinical-spine/nurse-vitals.",
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function GET(request: Request) {
  return withDeskDirectory(() => handleGET(request));
}
