import { NextResponse } from "next/server";

import { listBridgeStagingBundles } from "@/lib/repositories/bridge-staging-repository";
import { readReviewCaseById } from "@/lib/review-case-repository";
import { resolveTenantContext } from "@/lib/db/tenant-context";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";
import { resolveAcceptStagingBundle } from "@/lib/bridge-staging";

/**
 * Download clinician-accepted FHIR Bundle handoff (application/fhir+json).
 * Manual filing / demo handoff only — NOT network write-back · liveEmis:false.
 */
export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const { scopeKey, userId } = auth.context;
  const tenant = resolveTenantContext(request, auth.context);
  const reviewCase = await readReviewCaseById(params.id, scopeKey, userId, tenant.practiceId);

  if (!reviewCase) {
    return NextResponse.json({ error: "Case not found", liveEmis: false }, { status: 404 });
  }

  if (reviewCase.userId && reviewCase.userId !== userId) {
    return NextResponse.json({ error: "Unauthorized", liveEmis: false }, { status: 403 });
  }

  // Prefer durable BRIDGE staging for this case; else frozen export / fixtures
  const staged = await listBridgeStagingBundles({
    scopeKey,
    caseId: params.id,
    limit: 1
  });

  let bundle: Record<string, unknown>;
  let filename: string;
  let source: string;

  if (staged[0]?.bundle) {
    bundle = {
      ...staged[0].bundle,
      liveEmis: false,
      bridgeStatus: staged[0].status,
      handoffOnly: true
    };
    filename = `${params.id}-bridge-${staged[0].id}.fhir.json`;
    source = "bridge_staging";
  } else if (reviewCase.status === "accepted" || reviewCase.frozenArtifact) {
    const resolved = resolveAcceptStagingBundle({
      caseId: params.id,
      acceptedBy: auth.context.userEmail ?? userId,
      reviewCase
    });
    bundle = {
      ...resolved.bundle,
      liveEmis: false,
      handoffOnly: true
    };
    filename = `${params.id}-accept-handoff.fhir.json`;
    source = resolved.source;
  } else {
    return NextResponse.json(
      {
        error:
          "FHIR Bundle export requires an Accept decision (or prior BRIDGE staging). Drafts are not exportable as handoff Bundles.",
        liveEmis: false,
        status: reviewCase.status
      },
      { status: 409 }
    );
  }

  return NextResponse.json(bundle, {
    headers: {
      "Content-Type": "application/fhir+json",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-Aksh-Live-Emis": "false",
      "X-Aksh-Handoff-Only": "true",
      "X-Aksh-Bundle-Source": source
    }
  });
}
