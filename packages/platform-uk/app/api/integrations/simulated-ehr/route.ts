import { NextResponse } from "next/server";

import {
  getSimulatedEhrChartForPatient,
  getSimulatedEhrHonesty,
  listSimulatedEhrCharts,
  upsertSimulatedEhrCharts,
} from "@/lib/simulated-ehr";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId")?.trim();
  const honesty = getSimulatedEhrHonesty();

  if (patientId) {
    const chart = await getSimulatedEhrChartForPatient(patientId);
    return NextResponse.json({ ...honesty, chart });
  }

  const entries = await listSimulatedEhrCharts({ limit: 40 });
  return NextResponse.json({
    ...honesty,
    queueDepth: entries.length,
    entries,
    paths: {
      api: "/api/integrations/simulated-ehr",
      bridge: "/api/integrations/bridge-staging",
      emisStaging: "/api/integrations/emis-staging",
    },
  });
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  let body: {
    patientId?: string;
    caseId?: string;
    acceptedBy?: string;
    bridgeStagingId?: string;
    simWriteId?: string;
    bundleSummary?: string;
    resourceTypes?: string[];
  } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body.", liveEmis: false }, { status: 400 });
  }

  if (!body.bundleSummary?.trim()) {
    return NextResponse.json({ error: "bundleSummary is required.", liveEmis: false }, { status: 400 });
  }

  const entries = await upsertSimulatedEhrCharts({
    patientId: body.patientId,
    caseId: body.caseId,
    acceptedBy: body.acceptedBy ?? auth.context.userEmail ?? auth.context.userId,
    clinicianId: auth.context.userId,
    bridgeStagingId: body.bridgeStagingId,
    simWriteId: body.simWriteId,
    bundleSummary: body.bundleSummary,
    resourceTypes: body.resourceTypes,
  });

  return NextResponse.json({
    liveEmis: false,
    realPatientData: false,
    syntheticOnly: true,
    entries,
  });
}
