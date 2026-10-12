import { NextResponse } from "next/server";

import { runClinicalSpineOrchestrate } from "@/lib/clinical-spine/orchestrate";
import { prepareSpinePatient } from "@/lib/clinical-spine/spine-patient";
import { isRealWorkspace, TRACK_B_NOT_OPEN } from "@/lib/env/workspace";
import { errorResponse, requireContext } from "@/lib/network/http";

export const dynamic = "force-dynamic";

/**
 * POST /api/network/patients/:id/clinical-review — run the clinical-proof agents (CONDUCTOR, Aksh Diabetes) on one
 * care-network patient: the one patient spine (platform map G1/G2). Synthetic validation only; refused in the real
 * workspace until a governed go-live opens Track B. Output is a draft for a clinician; nothing is written to a record.
 */
export async function POST(_request: Request, props: { params: Promise<{ id: string }> }) {
  if (isRealWorkspace()) return NextResponse.json({ error: TRACK_B_NOT_OPEN }, { status: 403 });
  const { id } = await props.params;
  const auth = await requireContext();
  if (auth instanceof NextResponse) return auth;
  try {
    const spine = await prepareSpinePatient(auth.ctx, id.slice(0, 64));
    const result = await runClinicalSpineOrchestrate({ patientId: spine.patient.id, careNetwork: spine.careNetwork });
    return NextResponse.json({ provenance: { ...spine.provenance, track: "B", dataClass: "synthetic_validation" }, result });
  } catch (error) {
    return errorResponse(error, "network.patient.clinical-review");
  }
}
