import { NextResponse } from "next/server";

import { getBridgeStagingStatus, stageAcceptedCaseToBridge } from "@/lib/bridge-staging";
import {
  getBridgeStagingBundleById,
  listBridgeStagingBundles
} from "@/lib/repositories/bridge-staging-repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

/**
 * BRIDGE in-app FHIR staging — Neon/file durable store.
 * No Medplum OAuth. liveEmis:false hard.
 */
export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const caseId = url.searchParams.get("caseId") ?? undefined;
  const format = url.searchParams.get("format");

  if (id) {
    const record = await getBridgeStagingBundleById(id, auth.context.scopeKey);
    if (!record) {
      return NextResponse.json({ error: "Staging record not found", liveEmis: false }, { status: 404 });
    }
    if (format === "fhir" || format === "bundle") {
      return NextResponse.json(record.bundle, {
        headers: {
          "Content-Type": "application/fhir+json",
          "Content-Disposition": `attachment; filename="${record.id}.fhir.json"`,
          "X-Aksh-Live-Emis": "false",
          "X-Aksh-Bridge-Status": record.status
        }
      });
    }
    return NextResponse.json({
      record: {
        ...record,
        liveEmis: false,
        medplumRequired: false,
        syntheticOnly: true
      },
      liveEmis: false
    });
  }

  if (caseId) {
    const records = await listBridgeStagingBundles({
      scopeKey: auth.context.scopeKey,
      caseId,
      limit: 20
    });
    return NextResponse.json({
      caseId,
      records: records.map((r) => ({
        ...r,
        liveEmis: false as const,
        medplumRequired: false as const
      })),
      liveEmis: false
    });
  }

  const status = await getBridgeStagingStatus({ scopeKey: auth.context.scopeKey });
  return NextResponse.json({
    ...status,
    liveEmis: false,
    banner:
      "BRIDGE FHIR staging (Neon/file) · preliminary/staging only · Medplum not required · NOT live EHR"
  });
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  let body: {
    caseId?: string;
    practiceId?: string;
    runSimWriteback?: boolean;
    /** Explicit Accept signal — required so this is never an autonomous write path */
    clinicianAccept?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.clinicianAccept !== true) {
    return NextResponse.json(
      {
        error: "clinicianAccept:true is required. HITL Accept is mandatory before BRIDGE staging.",
        liveEmis: false,
        ehrWriteAttempted: false
      },
      { status: 400 }
    );
  }

  const caseId = body.caseId?.trim();
  if (!caseId) {
    return NextResponse.json({ error: "caseId is required.", liveEmis: false }, { status: 400 });
  }

  // Reject any attempt to claim live EMIS via body
  if ((body as { liveEmis?: unknown }).liveEmis === true) {
    return NextResponse.json(
      {
        error: "liveEmis:true is rejected. BRIDGE staging is sim/preliminary only.",
        liveEmis: false
      },
      { status: 400 }
    );
  }

  const result = await stageAcceptedCaseToBridge({
    caseId,
    acceptedBy: auth.context.userEmail ?? auth.context.userId,
    clinicianId: auth.context.userId,
    practiceId: body.practiceId,
    scopeKey: auth.context.scopeKey,
    runSimWriteback: body.runSimWriteback !== false
  });

  return NextResponse.json({
    ...result,
    liveEmis: false,
    message:
      "BRIDGE staged FHIR Bundle as preliminary. EHR queue + sim write-back only. NOT live EHR. Medplum not required."
  });
}
