import { NextResponse } from "next/server";

import { stageAcceptedCaseToBridge } from "@/lib/bridge-staging";
import { evaluateDecisionScope } from "@/lib/clinical-decision-scope";
import { resolveTenantContext } from "@/lib/db/tenant-context";
import { shouldSyncAcceptedCaseToMedplum } from "@/lib/integration-config";
import { pushToMedplum } from "@/lib/medplum-client";
import { persistItemDecision } from "@/lib/repositories/review-decision-repository";
import { readReviewCases } from "@/lib/review-case-repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";
import { buildEvidencePayload } from "@/lib/workflow";
import { CaseDecisionError, decideReviewCase, parseCaseDecision } from "@/lib/workflow/decide-review-case";

export const dynamic = "force-dynamic";

/**
 * POST /api/review-cases/:id/decision — accept, reject or defer a whole case.
 * The server checks the version, the safety blockers, the reviewer checklist and every required human gate, attributes
 * the decision to the signed-in account, and saves the case with its audit record in one transaction. On accept, the
 * evidence is frozen and the accepted content is staged (simulation only); the staging result is returned, including a
 * failure, so the reviewer sees it.
 */
export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response) return auth.response;
  const { scopeKey, userId, userRole } = auth.context;
  if (userRole !== "clinical_reviewer") {
    return NextResponse.json({ error: "Only a clinical reviewer may decide a case." }, { status: 403 });
  }
  try {
    const req = parseCaseDecision(await request.json().catch(() => ({})));
    const tenant = resolveTenantContext(request, auth.context);
    const existing = (await readReviewCases(scopeKey, tenant.practiceId)).find((c) => c.id === id.slice(0, 120));
    if (!existing) return NextResponse.json({ error: "Case not found" }, { status: 404 });
    if (existing.userId && existing.userId !== userId) return NextResponse.json({ error: "Not your case" }, { status: 403 });

    const actor = auth.context.userEmail ?? userId;
    const { next, outcome, audit } = decideReviewCase(existing, req, actor);
    const scope = evaluateDecisionScope({ persona: auth.context.clinicalPersona, existing, next });
    if (!scope.allowed) return NextResponse.json({ error: `Forbidden. ${scope.reason}` }, { status: 403 });

    const saved = await persistItemDecision({ next, expectedVersion: req.expectedVersion, scopeKey, practiceId: tenant.practiceId, userId, audit });

    // Accept → BRIDGE staging (simulation only, never a live record). A failure is reported, not hidden.
    let staging: { status: "staged" | "failed" | "not_applicable"; detail?: string; fhirResourceCount?: number; fhirExportPath?: string } = { status: "not_applicable" };
    if (req.decision === "accept") {
      try {
        const r = await stageAcceptedCaseToBridge({
          caseId: next.id,
          acceptedBy: actor,
          clinicianId: userId,
          practiceId: tenant.practiceId,
          scopeKey,
          reviewCase: next,
          runSimWriteback: true,
          patientId: next.patientId ?? null,
        });
        staging = { status: "staged", fhirResourceCount: r.fhirResourceCount, fhirExportPath: `/api/review-cases/${next.id}/export/fhir` };
      } catch (error) {
        staging = { status: "failed", detail: error instanceof Error ? error.message : "staging failed" };
      }
      if (shouldSyncAcceptedCaseToMedplum(existing, next, next) && next.frozenArtifact?.exportedResources) {
        void pushToMedplum(next.frozenArtifact.exportedResources).then((r) => {
          if (!r.ok) console.error("[medplum] Non-blocking rehearsal push failed:", r.error);
        });
      }
    }

    return NextResponse.json({
      reviewCase: next,
      evidence: buildEvidencePayload(next),
      outcome: { ...outcome, auditId: saved.auditId, auditDurable: saved.auditDurable },
      staging: { ...staging, liveRecordWrite: false },
    });
  } catch (error) {
    if (error instanceof CaseDecisionError) return NextResponse.json({ error: error.message, code: error.code, blockers: error.blockers }, { status: error.status });
    if (error instanceof Error && error.message.startsWith("STALE_CASE")) return NextResponse.json({ error: error.message, code: "STALE_CASE" }, { status: 409 });
    console.error("[case-decision] failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "The decision was not recorded. Nothing changed; try again." }, { status: 503 });
  }
}
