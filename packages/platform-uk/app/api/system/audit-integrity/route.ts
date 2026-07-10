import { NextResponse } from "next/server";

import { deriveAuditIntegrityReport } from "../../../../lib/audit-integrity";
import { readReviewCases } from "../../../../lib/review-case-repository";
import { requireAuthenticatedUserScope } from "../../../../lib/user-scope";

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response) return auth.response;

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
