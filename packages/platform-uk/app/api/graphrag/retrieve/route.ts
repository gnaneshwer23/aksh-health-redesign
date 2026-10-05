import { NextResponse } from "next/server";

import { assembleClinicalContext } from "@/lib/context-engine/assemble";
import { retrieveGraphRag } from "@/lib/graphrag/retrieve";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  let body: { patientId?: string; query?: string } = {};
  try {
    body = (await request.json()) as { patientId?: string; query?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const patientId = body.patientId?.trim();
  if (!patientId) {
    return NextResponse.json({ error: "patientId is required." }, { status: 400 });
  }

  const assembled = await assembleClinicalContext({
    patientId,
    purpose: "clinical_decision_support",
    actorRole: auth.context.userRole,
    boundPatientId: auth.context.boundPatientId,
  });
  if (!assembled.ok) {
    return NextResponse.json({ error: assembled.reason, liveEmis: false }, { status: assembled.status });
  }

  const rag = await retrieveGraphRag({
    patientId,
    query: body.query ?? "diabetes hba1c medications",
    context: assembled.package,
  });

  return NextResponse.json({ ...rag });
}
