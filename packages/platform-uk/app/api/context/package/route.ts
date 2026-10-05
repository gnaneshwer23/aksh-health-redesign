import { NextResponse } from "next/server";

import { assembleClinicalContext } from "@/lib/context-engine/assemble";
import type { ContextPurpose } from "@/lib/context-engine/types";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

function parsePurpose(raw: string | null): ContextPurpose {
  if (raw === "documentation" || raw === "medication_safety" || raw === "patient_self") return raw;
  return "clinical_decision_support";
}

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId")?.trim();
  if (!patientId) {
    return NextResponse.json({ error: "patientId is required." }, { status: 400 });
  }

  const result = await assembleClinicalContext({
    patientId,
    purpose: parsePurpose(searchParams.get("purpose")),
    actorRole: auth.context.userRole,
    boundPatientId: auth.context.boundPatientId,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.reason, liveEmis: false }, { status: result.status });
  }

  return NextResponse.json({ liveEmis: false, hitlRequired: true, package: result.package });
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  let body: { patientId?: string; purpose?: string } = {};
  try {
    body = (await request.json()) as { patientId?: string; purpose?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const patientId = body.patientId?.trim();
  if (!patientId) {
    return NextResponse.json({ error: "patientId is required." }, { status: 400 });
  }

  const result = await assembleClinicalContext({
    patientId,
    purpose: parsePurpose(body.purpose ?? null),
    actorRole: auth.context.userRole,
    boundPatientId: auth.context.boundPatientId,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.reason, liveEmis: false }, { status: result.status });
  }

  return NextResponse.json({ liveEmis: false, hitlRequired: true, package: result.package });
}
