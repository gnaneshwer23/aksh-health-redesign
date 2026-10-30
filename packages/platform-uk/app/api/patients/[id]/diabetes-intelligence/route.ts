import { NextResponse } from "next/server";

import { denyUnlessConnectedPatientAccess } from "@/lib/clinical-proof/connected-patient-access";
import {
  buildDiabetesGlucoseIntelligence,
  draftGlucoseIntelligenceReview,
  seedAndBuildDiabetesGlucoseIntelligence,
} from "@/lib/diabetes-intelligence";
import { appendGlucoseBatch } from "@/lib/diabetes-intelligence/glucose-repository";
import type { GlucoseIngestBatch } from "@/lib/diabetes-intelligence/glucose-types";
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

  const snapshot = await buildDiabetesGlucoseIntelligence(patientId, {
    scopeKey: auth.context.scopeKey,
  });
  return NextResponse.json(snapshot);
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
    action?: "seed_synthetic" | "ingest_batch" | "draft_review";
    batch?: GlucoseIngestBatch;
  } = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const actor = auth.context.userEmail ?? auth.context.userId;
  const scopeKey = auth.context.scopeKey;

  if (body.action === "seed_synthetic") {
    const snapshot = await seedAndBuildDiabetesGlucoseIntelligence(patientId, {
      scopeKey,
      actor,
    });
    return NextResponse.json({ ...snapshot, action: body.action });
  }

  if (body.action === "ingest_batch") {
    if (!body.batch?.channel || !Array.isArray(body.batch.points)) {
      return NextResponse.json(
        { error: "batch.channel and batch.points required for ingest_batch" },
        { status: 400 }
      );
    }
    await appendGlucoseBatch(patientId, body.batch, { scopeKey });
    const snapshot = await buildDiabetesGlucoseIntelligence(patientId, { scopeKey });
    return NextResponse.json({ ...snapshot, action: body.action });
  }

  if (body.action === "draft_review") {
    const snapshot = await draftGlucoseIntelligenceReview(patientId, {
      scopeKey,
      createdBy: actor,
    });
    return NextResponse.json({ ...snapshot, action: body.action });
  }

  return NextResponse.json(
    { error: "action must be seed_synthetic | ingest_batch | draft_review" },
    { status: 400 }
  );
}
