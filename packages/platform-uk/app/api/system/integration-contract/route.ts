import { NextResponse } from "next/server";

import { buildIntegrationBoundaryContract } from "../../../../lib/integration-boundary-contract";
import { resolveOptionalAuthenticatedUserScope } from "../../../../lib/user-scope";

/**
 * E0 (docs/PHASED_BUILD_PLAN_E.md) audit note, corrected during E2 build:
 * this route is deliberately public, unauthenticated read-only — it is
 * linked directly from the public `/security` marketing page as an
 * architecture-transparency artifact, and `tests/readonly-route-contracts.test.ts`
 * already locks in anonymous access for its sibling `database-contract`
 * route. E2 does not change this route's auth posture; it only hardens the
 * three system routes (`audit-integrity`, `permission-matrix`,
 * `clinical-safety-files`) that are session-gated already but had no role
 * check, and are not linked from any public page.
 */
export async function GET(request: Request) {
  const context = await resolveOptionalAuthenticatedUserScope(request);
  const contract = buildIntegrationBoundaryContract({
    generatedBy: context?.userEmail ?? context?.scopeKey ?? "public"
  });

  return NextResponse.json(contract, {
    headers: {
      "Content-Disposition": "attachment; filename=\"aksh-uk-eu-integration-boundary-contract.json\""
    }
  });
}
