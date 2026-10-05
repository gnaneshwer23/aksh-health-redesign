import { NextResponse } from "next/server";

import { runEvaluationEngineV1 } from "@/lib/evaluation-engine";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 60;

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId")?.trim() || "P002";
  const result = await runEvaluationEngineV1(patientId);
  return NextResponse.json(result);
}
