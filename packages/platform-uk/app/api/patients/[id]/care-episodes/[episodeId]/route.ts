import { NextResponse } from "next/server";

import { denyUnlessConnectedPatientAccess } from "@/lib/clinical-proof/connected-patient-access";
import {
  CareEpisodeTransitionError,
  getCareEpisode,
  listCareEpisodeEvents,
  transitionCareEpisode,
} from "@/lib/care-episode";
import type { CareEpisodeStatus } from "@/lib/care-episode";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

type RouteContext = { params: Promise<{ id: string; episodeId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const { id: patientIdRaw, episodeId: episodeIdRaw } = await context.params;
  const patientId = patientIdRaw?.trim();
  const episodeId = episodeIdRaw?.trim();
  if (!patientId || !episodeId) {
    return NextResponse.json({ error: "patient id and episode id required" }, { status: 400 });
  }

  const denied = denyUnlessConnectedPatientAccess(auth.context, patientId);
  if (denied) return denied;

  const episode = await getCareEpisode(episodeId, auth.context.scopeKey);
  if (!episode || episode.patientId !== patientId) {
    return NextResponse.json({ error: "Care episode not found" }, { status: 404 });
  }

  const events = await listCareEpisodeEvents(episodeId, auth.context.scopeKey);
  return NextResponse.json({ episode, events, ehrWrite: false, synthetic: true });
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const { id: patientIdRaw, episodeId: episodeIdRaw } = await context.params;
  const patientId = patientIdRaw?.trim();
  const episodeId = episodeIdRaw?.trim();
  if (!patientId || !episodeId) {
    return NextResponse.json({ error: "patient id and episode id required" }, { status: 400 });
  }

  const denied = denyUnlessConnectedPatientAccess(auth.context, patientId);
  if (denied) return denied;

  const existing = await getCareEpisode(episodeId, auth.context.scopeKey);
  if (!existing || existing.patientId !== patientId) {
    return NextResponse.json({ error: "Care episode not found" }, { status: 404 });
  }

  let body: {
    action?: "transition";
    toStatus?: CareEpisodeStatus;
    reason?: string;
    idempotencyKey?: string;
    expectedVersion?: number;
  } = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.action !== "transition" || !body.toStatus) {
    return NextResponse.json(
      { error: "action must be transition with toStatus" },
      { status: 400 }
    );
  }

  const actor = auth.context.userEmail ?? auth.context.userId;
  try {
    const { episode, event } = await transitionCareEpisode({
      episodeId,
      toStatus: body.toStatus,
      actor,
      reason: body.reason,
      scopeKey: auth.context.scopeKey,
      idempotencyKey: body.idempotencyKey,
      expectedVersion: body.expectedVersion,
    });
    return NextResponse.json({ episode, event, ehrWrite: false, synthetic: true });
  } catch (err) {
    if (err instanceof CareEpisodeTransitionError) {
      const status = err.code === "NOT_FOUND" ? 404 : err.code === "VERSION_CONFLICT" ? 409 : 400;
      return NextResponse.json(
        { error: err.message, code: err.code, ehrWrite: false },
        { status }
      );
    }
    throw err;
  }
}
