import { NextResponse } from "next/server";

import { listModalityContractSummaries } from "@/lib/precision-health/modalities";
import { purposeCodeSchema } from "@/lib/precision-health/consent";
import {
  ingestModalitySampleStub,
  listModalitySamples
} from "@/lib/repositories/modality-sample-repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const url = new URL(request.url);
  const patientId = url.searchParams.get("patientId") ?? undefined;
  const modality = url.searchParams.get("modality") ?? undefined;

  const samples = await listModalitySamples({
    scopeKey: auth.context.scopeKey,
    patientId,
    modality: modality ?? undefined
  });

  return NextResponse.json({
    contracts: listModalityContractSummaries(),
    samples,
    liveStream: false,
    realPatientData: false,
    note: "Phase 1 modality contracts + synthetic fixtures / ingestion stubs only."
  });
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  let body: { sample?: unknown; purposeCode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const purpose = purposeCodeSchema.safeParse(body.purposeCode ?? "care_delivery");
  if (!purpose.success) {
    return NextResponse.json({ error: "Invalid purposeCode." }, { status: 400 });
  }

  try {
    const result = await ingestModalitySampleStub(body.sample, {
      scopeKey: auth.context.scopeKey,
      purposeCode: purpose.data
    });

    return NextResponse.json({
      ...result,
      ehrWrite: false
    }, { status: result.accepted ? 200 : 403 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ingestion stub failed.", liveStream: false },
      { status: 400 }
    );
  }
}
