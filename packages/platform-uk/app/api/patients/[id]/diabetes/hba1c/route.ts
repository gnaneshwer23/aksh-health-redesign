import { normaliseLab } from "@/lib/labs/catalog";
import { NextResponse } from "next/server";

import { recordDiabetesHbA1cReading, loadIngestedDiabetesReadings } from "@/lib/disease-modules/diabetes/ingest";
import { isDiabetesModuleEnabled } from "@/lib/integration-config";
import { getPatientById } from "@/lib/mock-data";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/patients/[id]/diabetes/hba1c — C6 (docs/PHASED_BUILD_PLAN_C.md,
 * implements docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md P1-2).
 *
 * Records one real HbA1c lab reading as a Patient State fact (C1). Gated
 * identically to the existing diabetes-coaching routes: ENABLE_DIABETES_MODULE
 * must be true and the patient must be diabetes-flagged, otherwise an honest
 * 404. Unlike Glucose, HbA1c is not gated on OQ-DIAB-1 — once at least two
 * ingested readings exist, buildHbA1cSignal's real two-point trend
 * derivation (lib/disease-modules/diabetes/hba1c.ts) uses them directly.
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
      { error: "Diabetes HbA1c ingestion is unavailable for this patient — module disabled or not diabetes-flagged." },
      { status: 404 }
    );
  }

  // mmol/mol (IFCC) is the stored unit; a value in % is accepted and converted (lib/labs/catalog.ts).
  let body: { recordedAt?: string; valueMmolMol?: number; valuePercent?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const recordedAt = body.recordedAt?.trim();
  const sent = typeof body.valueMmolMol === "number" ? { value: body.valueMmolMol, unit: "mmol/mol" } : { value: body.valuePercent ?? NaN, unit: "%" };
  const normalised = normaliseLab("hba1c", sent.value, sent.unit);
  if (!recordedAt || Number.isNaN(new Date(recordedAt).getTime())) {
    return NextResponse.json({ error: "recordedAt (ISO 8601 timestamp) is required." }, { status: 400 });
  }
  if (!normalised.ok) {
    return NextResponse.json({ error: `Send valueMmolMol (or valuePercent): ${normalised.message}` }, { status: 400 });
  }

  const { fact, source } = await recordDiabetesHbA1cReading(
    {
      patientId,
      reading: { recordedAt, valueMmolMol: normalised.value },
      source: { system: "diabetes_ingest_api", reference: auth.context.userEmail ?? auth.context.userId }
    },
    { scopeKey: auth.context.scopeKey }
  );

  const { hba1cReadings } = await loadIngestedDiabetesReadings(patientId, { scopeKey: auth.context.scopeKey });

  return NextResponse.json({
    recorded: true,
    source,
    fact,
    seriesLength: hba1cReadings.length,
    ehrWrite: false,
    hitlRequired: true,
    note:
      "Reading stored as a Patient State fact (C1/C6). Once at least two readings are on file, HbA1c Intelligence's real two-point trend derivation uses them directly — non-diagnostic, never a clinical prediction."
  });
}
