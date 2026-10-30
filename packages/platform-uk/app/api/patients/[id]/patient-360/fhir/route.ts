import { NextResponse } from "next/server";

import { denyUnlessConnectedPatientAccess } from "@/lib/clinical-proof/connected-patient-access";
import { buildPatient360, patient360ToFhirBundle } from "@/lib/patient-intelligence";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

type RouteContext = { params: Promise<{ id: string }> };

/** FHIR R4–shaped Bundle snapshot for Patient 360. Staging only — ehrWrite=false. */
export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const patientId = (await context.params).id?.trim();
  if (!patientId) {
    return NextResponse.json({ error: "patient id required" }, { status: 400 });
  }

  const denied = denyUnlessConnectedPatientAccess(auth.context, patientId);
  if (denied) return denied;

  const profile = await buildPatient360(patientId, { scopeKey: auth.context.scopeKey });
  const bundle = patient360ToFhirBundle(profile);

  return NextResponse.json({
    ...bundle,
    note: "FHIR-compatible Patient 360 snapshot — synthetic staging; not an EHR write.",
    hitlRequired: true,
    synthetic: true,
  });
}
