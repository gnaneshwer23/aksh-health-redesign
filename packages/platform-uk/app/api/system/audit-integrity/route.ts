import { NextResponse } from "next/server";

import { deriveAuditIntegrityReport } from "../../../../lib/audit-integrity";
import { readReviewCases } from "../../../../lib/review-case-repository";
import { requireAppRole } from "../../../../lib/user-scope";

/**
 * E2 (docs/PHASED_BUILD_PLAN_E.md, P3-2): previously required authentication
 * but enforced no role check — any authenticated role, including
 * patient/researcher, could pull this audit report. Now restricted to the
 * roles `lib/permission-matrix.ts`'s `governance_pack_view` action already
 * documents as allowed (`clinical_reviewer`/`operations_lead`). This route
 * is not linked from any public page (only from the session-gated
 * `/review/governance-pack`), so this is a pure narrowing with no public
 * page to break (contrast `integration-contract`/`database-contract`,
 * which stay deliberately public per `tests/readonly-route-contracts.test.ts`).
 */
export async function GET(request: Request) {
  const auth = await requireAppRole(request, ["clinical_reviewer", "operations_lead"]);
  if (auth.response || !auth.context) return auth.response;

  const { scopeKey, userId, userEmail } = auth.context;
  const cases = await readReviewCases(scopeKey);
  const report = deriveAuditIntegrityReport(cases, { scopeKey, generatedAt: new Date().toISOString() });

  return NextResponse.json(
    {
      ...report,
      generatedBy: userEmail ?? "Aksh Health UK/EU synthetic proof system"
    },
    {
      headers: {
        "Content-Disposition": `attachment; filename="aksh-uk-eu-audit-integrity-${userId}.json"`
      }
    }
  );
}
