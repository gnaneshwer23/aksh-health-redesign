import { NextResponse } from "next/server";

import {
  buildPatient360,
  seedAndBuildPatient360,
  startMedicationReconciliation,
} from "@/lib/patient-intelligence";
import { appendSharingPreference, randomUUID } from "@/lib/patient-intelligence/repository";
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

  const profile = await buildPatient360(patientId, { scopeKey: auth.context.scopeKey });
  return NextResponse.json(profile);
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const patientId = (await context.params).id?.trim();
  if (!patientId) {
    return NextResponse.json({ error: "patient id required" }, { status: 400 });
  }

  let body: {
    action?: "seed_synthetic" | "start_med_recon" | "record_sharing_preference";
    purpose?:
      | "direct_care"
      | "care_coordination"
      | "contact"
      | "research"
      | "data_sharing"
      | "device_data";
    status?: "granted" | "withdrawn" | "denied";
    basis?: string;
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
    const profile = await seedAndBuildPatient360(patientId, { scopeKey, actor });
    return NextResponse.json({ ...profile, action: body.action });
  }

  if (body.action === "start_med_recon") {
    const profile = await startMedicationReconciliation(patientId, {
      scopeKey,
      createdBy: actor,
    });
    return NextResponse.json({ ...profile, action: body.action });
  }

  if (body.action === "record_sharing_preference") {
    if (!body.purpose || !body.status) {
      return NextResponse.json(
        { error: "purpose and status required for record_sharing_preference" },
        { status: 400 }
      );
    }
    await appendSharingPreference(
      {
        id: `share-${randomUUID()}`,
        patientId,
        purpose: body.purpose,
        status: body.status,
        basis: body.basis ?? "clinician-recorded preference (synthetic)",
        recordedBy: actor,
        recordedAt: new Date().toISOString(),
      },
      { scopeKey }
    );
    const profile = await buildPatient360(patientId, { scopeKey });
    return NextResponse.json({ ...profile, action: body.action });
  }

  return NextResponse.json(
    {
      error:
        "action must be seed_synthetic | start_med_recon | record_sharing_preference",
    },
    { status: 400 }
  );
}
