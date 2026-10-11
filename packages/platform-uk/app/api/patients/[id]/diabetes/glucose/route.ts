import { NextResponse } from "next/server";

import { recordDiabetesGlucoseReading, loadIngestedDiabetesReadings } from "@/lib/disease-modules/diabetes/ingest";
import { isDiabetesModuleEnabled } from "@/lib/integration-config";
import { getPatientById } from "@/lib/mock-data";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

type RouteContext = { params: Promise<{ id: string }> };

const VALID_CONTEXTS = new Set(["fasting", "post_prandial", "bedtime", "unspecified"]);

/**
 * POST /api/patients/[id]/diabetes/glucose — C6 (docs/PHASED_BUILD_PLAN_C.md,
 * implements docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md P1-2).
 *
 * Records one real glucose reading as a Patient State fact (C1). Gated
 * identically to the existing diabetes-coaching routes: ENABLE_DIABETES_MODULE
 * must be true and the patient must be diabetes-flagged, otherwise an honest
 * 404 — never a fabricated acceptance. Does NOT compute TIR/variability/
 * patterns here or anywhere downstream — that stays `insufficient_data`
 * pending OQ-DIAB-1 (glucose/CGM modality decision); this endpoint only
 * stores the raw reading with provenance.
 */
export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const patientId = (await context.params).id?.trim();
  if (!patientId) {
    return NextResponse.json({ error: "patient id required" }, { status: 400 });
  }

  const diabetesModuleEnabled = isDiabetesModuleEnabled();
  const diabetesFlagged = Boolean(getPatientById(patientId)?.clinicalProfiles?.includes("t2d"));
  if (!diabetesModuleEnabled || !diabetesFlagged) {
    return NextResponse.json(
      { error: "Diabetes glucose ingestion is unavailable for this patient — module disabled or not diabetes-flagged." },
      { status: 404 }
    );
  }

  let body: { recordedAt?: string; glucoseMgDl?: number; context?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const recordedAt = body.recordedAt?.trim();
  const glucoseMgDl = body.glucoseMgDl;
  if (!recordedAt || Number.isNaN(new Date(recordedAt).getTime())) {
    return NextResponse.json({ error: "recordedAt (ISO 8601 timestamp) is required." }, { status: 400 });
  }
  if (typeof glucoseMgDl !== "number" || !Number.isFinite(glucoseMgDl) || glucoseMgDl <= 0) {
    return NextResponse.json({ error: "glucoseMgDl must be a positive number." }, { status: 400 });
  }
  const readingContext = body.context && VALID_CONTEXTS.has(body.context) ? (body.context as "fasting" | "post_prandial" | "bedtime" | "unspecified") : undefined;

  const { fact, source } = await recordDiabetesGlucoseReading(
    {
      patientId,
      reading: { recordedAt, glucoseMgDl, context: readingContext },
      source: { system: "diabetes_ingest_api", reference: auth.context.userEmail ?? auth.context.userId }
    },
    { scopeKey: auth.context.scopeKey }
  );

  const { glucoseReadings } = await loadIngestedDiabetesReadings(patientId, { scopeKey: auth.context.scopeKey });

  return NextResponse.json({
    recorded: true,
    source,
    fact,
    seriesLength: glucoseReadings.length,
    ehrWrite: false,
    hitlRequired: true,
    note:
      "Reading stored as a Patient State fact (C1/C6). Glucose Intelligence derivation (TIR/variability/patterns) stays insufficient_data pending OQ-DIAB-1 — ingestion changes the reading count only, never the derivation."
  });
}
