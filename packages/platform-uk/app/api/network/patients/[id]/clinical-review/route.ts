import { NextResponse } from "next/server";

import { correlateCareEpisodeStage, readCareEpisodeId } from "@/lib/care-episode";
import { buildSpineReviewCase } from "@/lib/clinical-spine/enqueue";
import { runClinicalSpineOrchestrate } from "@/lib/clinical-spine/orchestrate";
import { attachPracticeIdToCase, resolveTenantContext } from "@/lib/db/tenant-context";
import { createReviewCase } from "@/lib/review-case-repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";
import { prepareSpinePatient } from "@/lib/clinical-spine/spine-patient";
import { isRealWorkspace, TRACK_B_NOT_OPEN } from "@/lib/env/workspace";
import { errorResponse, requireContext } from "@/lib/network/http";

export const dynamic = "force-dynamic";

/**
 * POST /api/network/patients/:id/clinical-review — run the agents (CONDUCTOR, Aksh Diabetes) on one care-network
 * patient and put their drafts in the review queue (FLOW-JRN-1): a review case in CONDUCTOR's review order, for the
 * requesting clinician to accept, edit or reject on the server. GUARDIAN BLOCK enqueues nothing. Synthetic validation
 * only; refused in the real workspace until a governed go-live opens Track B. Nothing is written to a record.
 * Optional JSON body `{ careEpisodeId }` correlates the review case to the care-episode spine.
 */
export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  if (isRealWorkspace()) return NextResponse.json({ error: TRACK_B_NOT_OPEN }, { status: 403 });
  const { id } = await props.params;
  const auth = await requireContext();
  if (auth instanceof NextResponse) return auth;
  try {
    let bodyCareEpisodeId: string | undefined;
    try {
      const raw = await request.clone().json();
      bodyCareEpisodeId = readCareEpisodeId(raw as { careEpisodeId?: string; care_episode_id?: string });
    } catch {
      bodyCareEpisodeId = undefined;
    }

    const spine = await prepareSpinePatient(auth.ctx, id.slice(0, 64));
    const result = await runClinicalSpineOrchestrate({ patientId: spine.patient.id, careNetwork: spine.careNetwork, includeDrAssist: true });
    let review: {
      enqueued: boolean;
      caseId?: string;
      items?: number;
      reason?: string;
      careEpisodeId?: string;
    } = { enqueued: false, reason: "GUARDIAN blocked the drafts; nothing was enqueued" };
    if (result.draftEnqueueAllowed) {
      const scope = await requireAuthenticatedUserScope(request);
      if (scope.response) return scope.response;
      const tenant = resolveTenantContext(request, scope.context);
      const actor = scope.context.userEmail ?? scope.context.userId;
      const correlated = await correlateCareEpisodeStage({
        patientId: spine.patient.id,
        patientLabel: spine.patient.name,
        actor,
        scopeKey: scope.context.scopeKey,
        careEpisodeId: bodyCareEpisodeId,
        stage: "clinical_review",
        practiceId: tenant.practiceId,
      });
      const reviewCase = attachPracticeIdToCase(
        buildSpineReviewCase({
          patientId: spine.patient.id,
          patientLabel: spine.patient.name,
          result,
          userId: scope.context.userId,
          careEpisodeId: correlated.careEpisodeId,
        }),
        tenant.practiceId
      );
      const created = await createReviewCase(reviewCase, scope.context.scopeKey, scope.context.userId, tenant.practiceId);
      await correlateCareEpisodeStage({
        patientId: spine.patient.id,
        patientLabel: spine.patient.name,
        actor,
        scopeKey: scope.context.scopeKey,
        careEpisodeId: correlated.careEpisodeId,
        stage: "clinical_review",
        linkId: created.id,
        linkLabel: "CONDUCTOR clinical review case",
        practiceId: tenant.practiceId,
      });
      review = {
        enqueued: true,
        caseId: created.id,
        items: created.reviewQueueItems?.length ?? 0,
        careEpisodeId: correlated.careEpisodeId,
      };
    }
    return NextResponse.json({ provenance: { ...spine.provenance, track: "B", dataClass: "synthetic_validation" }, result, review });
  } catch (error) {
    return errorResponse(error, "network.patient.clinical-review");
  }
}
