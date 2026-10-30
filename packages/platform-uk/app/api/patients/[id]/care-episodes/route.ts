import { NextResponse } from "next/server";

import { denyUnlessConnectedPatientAccess } from "@/lib/clinical-proof/connected-patient-access";
import {
  createCareEpisode,
  listCareEpisodesForPatient,
} from "@/lib/care-episode";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const patientId = (await context.params).id?.trim();
  if (!patientId) {
    return NextResponse.json({ error: "patient id required" }, { status: 400 });
  }

  const denied = denyUnlessConnectedPatientAccess(auth.context, patientId);
  if (denied) return denied;

  const episodes = await listCareEpisodesForPatient(patientId, auth.context.scopeKey);
  return NextResponse.json({
    patientId,
    episodes,
    ehrWrite: false,
    synthetic: true,
    count: episodes.length,
  });
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const patientId = (await context.params).id?.trim();
  if (!patientId) {
    return NextResponse.json({ error: "patient id required" }, { status: 400 });
  }

  const denied = denyUnlessConnectedPatientAccess(auth.context, patientId);
  if (denied) return denied;

  let body: {
    pathway?: string;
    patientLabel?: string;
    organisationId?: string;
    practiceId?: string;
    idempotencyKey?: string;
    initialStatus?: "draft" | "intake" | "scheduled";
    metadata?: Record<string, unknown>;
  } = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const actor = auth.context.userEmail ?? auth.context.userId;
  const episode = await createCareEpisode({
    patientId,
    patientLabel: body.patientLabel,
    organisationId: body.organisationId,
    practiceId: body.practiceId,
    scopeKey: auth.context.scopeKey,
    pathway: body.pathway,
    createdBy: actor,
    idempotencyKey: body.idempotencyKey,
    initialStatus: body.initialStatus,
    metadata: body.metadata,
  });

  return NextResponse.json(
    { episode, ehrWrite: false, synthetic: true },
    { status: 201 }
  );
}
