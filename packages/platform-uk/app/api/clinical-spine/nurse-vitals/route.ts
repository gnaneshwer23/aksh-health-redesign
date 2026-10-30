import { NextResponse } from "next/server";

import { correlateCareEpisodeStage, handoffNurseToGp, readCareEpisodeId } from "@/lib/care-episode";
import { recordNurseVitalsOnSpine } from "@/lib/clinical-spine/role-events";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

/**
 * POST /api/clinical-spine/nurse-vitals
 * Nurse observations → shared modality store → timeline (+ Neo4j MEASURED when live).
 * Never claims live EMIS / EHR write. Optional careEpisodeId for journey correlation.
 */
export async function POST(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  let body: {
    patientId?: string;
    patientLabel?: string;
    vitals?: Record<string, string>;
    updateKg?: boolean;
    careEpisodeId?: string;
    care_episode_id?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body.", ehrWrite: false, liveEmis: false }, { status: 400 });
  }

  if (!body.patientId?.trim()) {
    return NextResponse.json({ error: "patientId is required.", ehrWrite: false, liveEmis: false }, { status: 400 });
  }

  try {
    const result = await recordNurseVitalsOnSpine(
      {
        patientId: body.patientId.trim(),
        patientLabel: body.patientLabel,
        vitals: {
          bpSys: body.vitals?.bpSys,
          bpDia: body.vitals?.bpDia,
          hr: body.vitals?.hr,
          rr: body.vitals?.rr,
          spo2: body.vitals?.spo2,
          temp: body.vitals?.temp,
          weight: body.vitals?.weight
        },
        updateKg: body.updateKg
      },
      {
        scopeKey: auth.context.scopeKey,
        actor: auth.context.userEmail ?? auth.context.userId
      }
    );

    let careEpisodeId = readCareEpisodeId(body);
    let gpHandoffCreated = false;
    if (result.accepted) {
      const correlated = await correlateCareEpisodeStage({
        patientId: body.patientId.trim(),
        patientLabel: body.patientLabel,
        actor: auth.context.userEmail ?? auth.context.userId,
        scopeKey: auth.context.scopeKey,
        careEpisodeId,
        stage: "nurse_observations",
        linkId: result.sample?.id,
        linkLabel: "Nurse vitals observation",
      });
      careEpisodeId = correlated.careEpisodeId;
      const handoff = await handoffNurseToGp({
        patientId: body.patientId.trim(),
        actor: auth.context.userEmail ?? auth.context.userId,
        scopeKey: auth.context.scopeKey,
        careEpisodeId,
        vitalsSampleId: result.sample?.id ?? `vitals-${body.patientId.trim()}`,
      });
      gpHandoffCreated = handoff.created;
    }

    return NextResponse.json(
      { ...result, careEpisodeId, gpHandoffCreated, autonomous: false },
      { status: result.accepted ? 200 : 403 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Nurse vitals spine write failed.",
        ehrWrite: false,
        liveEmis: false,
        physiologicalTwin: false
      },
      { status: 400 }
    );
  }
}
