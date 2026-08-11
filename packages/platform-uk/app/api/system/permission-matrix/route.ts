import { NextResponse } from "next/server";

import { buildRolePermissionMatrix } from "../../../../lib/permission-matrix";
import { requireAppRole } from "../../../../lib/user-scope";

/**
 * E2 (docs/PHASED_BUILD_PLAN_E.md, P3-2): previously required authentication
 * but enforced no role check. Now restricted to the roles this very matrix
 * already documents as allowed for `export_system_contracts`
 * (`clinical_reviewer`/`operations_lead`) — closing the gap between the
 * matrix's documented intent and this route's own enforcement. Not linked
 * from any public page (only from the session-gated `/review/governance-pack`).
 */
export async function GET(request: Request) {
  const auth = await requireAppRole(request, ["clinical_reviewer", "operations_lead"]);
  if (auth.response || !auth.context) return auth.response;

  const { userEmail } = auth.context;
  const matrix = buildRolePermissionMatrix({
    generatedBy: userEmail ?? undefined
  });

  return NextResponse.json(matrix, {
    headers: {
      "Content-Disposition": "attachment; filename=\"aksh-uk-eu-role-permission-matrix.json\""
    }
  });
}
