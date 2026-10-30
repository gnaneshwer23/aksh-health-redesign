import { NextResponse } from "next/server";

import { denyUnlessConnectedPatientAccess } from "@/lib/clinical-proof/connected-patient-access";
import {
  buildDiabetesJourney,
  draftJourneyCarePlan,
  seedSyntheticJourney,
} from "@/lib/diabetes-intelligence/journey";
import { recordGlucoseViaBridge } from "@/lib/diabetes-intelligence/glucose-bridge";
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

  const journey = await buildDiabetesJourney(patientId, {
    scopeKey: auth.context.scopeKey,
  });

  return NextResponse.json({
    ...journey,
    note: "Connected diabetes journey — synthetic demo; ehrWrite=false; not clinically validated.",
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
    action?: "seed_synthetic" | "record_glucose" | "draft_care_plan";
    glucoseMgDl?: number;
    recordedAt?: string;
    context?: "fasting" | "post_prandial" | "bedtime" | "unspecified";
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
    const journey = await seedSyntheticJourney(patientId, { scopeKey, actor });
    return NextResponse.json({ ...journey, action: body.action });
  }

  if (body.action === "record_glucose") {
    if (typeof body.glucoseMgDl !== "number") {
      return NextResponse.json({ error: "glucoseMgDl required" }, { status: 400 });
    }
    await recordGlucoseViaBridge(
      {
        patientId,
        reading: {
          recordedAt: body.recordedAt ?? new Date().toISOString(),
          glucoseMgDl: body.glucoseMgDl,
          context: body.context,
        },
      },
      { scopeKey, sourceSystem: "diabetes_journey_api" }
    );
    const journey = await buildDiabetesJourney(patientId, { scopeKey });
    return NextResponse.json({ ...journey, action: body.action });
  }

  if (body.action === "draft_care_plan") {
    const journey = await draftJourneyCarePlan(patientId, { scopeKey, createdBy: actor });
    return NextResponse.json({ ...journey, action: body.action });
  }

  return NextResponse.json(
    { error: "action must be seed_synthetic | record_glucose | draft_care_plan" },
    { status: 400 }
  );
}
