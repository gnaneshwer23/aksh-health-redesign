import { NextResponse } from "next/server";

import { buildClinicalSafetyFilesArtifact } from "../../../../lib/clinical-safety-files";
import { requireAppRole } from "../../../../lib/user-scope";

/**
 * E2 (docs/PHASED_BUILD_PLAN_E.md, P3-2): previously required authentication
 * but enforced no role check. Now restricted to the roles this route's
 * governance-pack action already documents as allowed
 * (`clinical_reviewer`/`operations_lead`, per `lib/permission-matrix.ts`'s
 * `governance_pack_view` row). Not linked from any public page.
 */
export async function GET(request: Request) {
  const auth = await requireAppRole(request, ["clinical_reviewer", "operations_lead"]);
  if (auth.response || !auth.context) return auth.response;

  const artifact = buildClinicalSafetyFilesArtifact();

  return NextResponse.json(artifact, {
    headers: {
      "Content-Disposition": "attachment; filename=\"aksh-uk-eu-clinical-safety-file-placeholders.json\""
    }
  });
}
