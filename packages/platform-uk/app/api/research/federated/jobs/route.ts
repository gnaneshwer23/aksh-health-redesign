import { NextResponse } from "next/server";

import {
  createFederatedJob,
  createFederatedJobSchema,
  getFederatedResearchStatus,
  listFederatedJobs
} from "@/lib/precision-health/federated-research";
import { persistShieldAuditEvent } from "@/lib/repositories/shield-audit-repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";
import { canAccessResearchEvaluation } from "@/app/api/research/evaluation/route";

export const maxDuration = 30;

/**
 * E3 (docs/PHASED_BUILD_PLAN_E.md, P3-4): previously required authentication
 * but enforced no role check — unlike its sibling `/api/research/evaluation`,
 * which already restricts to `RESEARCH_EVALUATION_ROLES` via
 * `canAccessResearchEvaluation`. Any authenticated role (including
 * `patient`) could previously create/list federated research jobs. Now
 * reuses that exact same check (same allow-list, same session/test-header
 * resolution — not a re-derivation against the AppRole-mapped model
 * `requireAuthenticatedUserScope` uses, which is a different role
 * vocabulary), closing the inconsistency without touching the ethics gate
 * below, which is independent of and unaffected by this role check.
 */
function forbiddenResearchWorkspaceResponse() {
  return NextResponse.json(
    { error: "Forbidden. Researcher or admin role required.", patientLevelExport: false, ehrWrite: false },
    { status: 403 }
  );
}

/**
 * GET /api/research/federated/jobs
 * List federated research jobs + status (synthetic aggregates only).
 */
export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;
  if (!(await canAccessResearchEvaluation(request))) {
    return forbiddenResearchWorkspaceResponse();
  }

  return NextResponse.json({
    ...getFederatedResearchStatus(),
    jobs: listFederatedJobs()
  });
}

/**
 * POST /api/research/federated/jobs
 * Create a federated job. Ethics gate required; synthetic aggregates only; no patient-level export.
 */
export async function POST(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;
  if (!(await canAccessResearchEvaluation(request))) {
    return forbiddenResearchWorkspaceResponse();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body.", patientLevelExport: false, ehrWrite: false },
      { status: 400 }
    );
  }

  try {
    const input = createFederatedJobSchema.parse(body);
    const job = createFederatedJob({
      title: input.title,
      ethicsApprovedClaim: input.ethicsApprovedClaim
    });

    void persistShieldAuditEvent({
      action: "defer",
      actor: auth.context.userEmail ?? auth.context.userId,
      label: `SHIELD: federated research job ${job.status}`,
      detail: `${job.title} · ethicsGate=${job.ethicsGatePassed} · syntheticAggregatesOnly`,
      category: "system",
      agentLabel: "FEDERATED",
      resourceRef: job.id,
      payload: {
        jobId: job.id,
        status: job.status,
        ethicsGatePassed: job.ethicsGatePassed,
        patientLevelExport: false,
        syntheticAggregatesOnly: true,
        ehrWrite: false
      }
    });

    const status = job.status === "blocked_ethics" ? 403 : 201;
    return NextResponse.json(
      {
        job,
        ...getFederatedResearchStatus(),
        ehrWrite: false
      },
      { status }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Federated job failed.",
        patientLevelExport: false,
        ehrWrite: false
      },
      { status: 400 }
    );
  }
}
