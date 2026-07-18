import { NextResponse } from "next/server";

import {
  createFederatedJob,
  createFederatedJobSchema,
  getFederatedResearchStatus,
  listFederatedJobs
} from "@/lib/precision-health/federated-research";
import { persistShieldAuditEvent } from "@/lib/repositories/shield-audit-repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

/**
 * GET /api/research/federated/jobs
 * List federated research jobs + status (synthetic aggregates only).
 */
export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

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
