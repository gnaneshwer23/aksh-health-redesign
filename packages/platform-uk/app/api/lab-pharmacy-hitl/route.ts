/**
 * Milestone C3 — Lab / pharmacy product HITL API.
 * GET: list role-scoped queues · POST: stage draft (GP/facilitator).
 * Simulation only — live:false · ehrWrite:false · no EPS / pathology.
 */
import { NextResponse } from "next/server";

import {
  LAB_PHARMACY_HITL_HONESTY,
  LAB_PHARMACY_HITL_HONESTY_LINES,
  labPharmacyHitlCapabilities,
  type LabPharmacyKind,
} from "@/lib/lab-pharmacy-hitl";
import {
  listLabPharmacyDrafts,
  stageAndPersistLabPharmacyDraft,
} from "@/lib/repositories/lab-pharmacy-hitl-repository";
import { resolveTenantContext } from "@/lib/db/tenant-context";
import { AGENT_OPS_ROLES, REVIEW_DECISION_ROLES } from "@/lib/security/agent-authz";
import { requireAppRole } from "@/lib/user-scope";

export const dynamic = "force-dynamic";

const READ_ROLES = [...new Set([...AGENT_OPS_ROLES, ...REVIEW_DECISION_ROLES])];
const STAGE_ROLES = [...new Set([...AGENT_OPS_ROLES, ...REVIEW_DECISION_ROLES])];

export async function GET(request: Request) {
  const auth = await requireAppRole(request, READ_ROLES);
  if (auth.response || !auth.context) return auth.response;

  const url = new URL(request.url);
  if (url.searchParams.get("view") === "capabilities") {
    return NextResponse.json({
      ...labPharmacyHitlCapabilities(),
      honestyLines: LAB_PHARMACY_HITL_HONESTY_LINES,
    });
  }

  const kindParam = url.searchParams.get("kind");
  const kind =
    kindParam === "lab" || kindParam === "pharmacy" ? (kindParam as LabPharmacyKind) : undefined;
  const statusParam = url.searchParams.get("status");
  const status =
    statusParam === "open" ||
    statusParam === "pending_review" ||
    statusParam === "accepted" ||
    statusParam === "edited" ||
    statusParam === "rejected" ||
    statusParam === "staged"
      ? statusParam
      : "open";
  const limit = Number(url.searchParams.get("limit") ?? "40");

  const tenant = resolveTenantContext(request, auth.context);
  // Practice-scoped store so GP → lab → pharmacy multi-role sessions share one queue
  // (per-user scopeKey would isolate roles from each other).
  const storeKey = `practice_${tenant.practiceId}`.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
  const { drafts, source } = await listLabPharmacyDrafts({
    scopeKey: storeKey,
    kind,
    status,
    organisationId: tenant.practiceId,
    limit: Number.isFinite(limit) ? limit : 40,
  });

  return NextResponse.json({
    ...LAB_PHARMACY_HITL_HONESTY,
    source,
    count: drafts.length,
    drafts,
    honestyLines: LAB_PHARMACY_HITL_HONESTY_LINES,
    note:
      source === "file"
        ? "Drafts persisted file-scoped by tenant; SHIELD dual-write when Postgres is configured."
        : "Draft list source unavailable.",
  });
}

export async function POST(request: Request) {
  const auth = await requireAppRole(request, STAGE_ROLES);
  if (auth.response || !auth.context) return auth.response;

  let body: {
    kind?: string;
    syntheticPatientId?: string;
    items?: string[];
    title?: string;
    summary?: string;
    careEpisodeId?: string | null;
    caseId?: string | null;
    organisationId?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.kind !== "lab" && body.kind !== "pharmacy") {
    return NextResponse.json({ error: 'kind must be "lab" or "pharmacy".' }, { status: 400 });
  }
  if (!body.syntheticPatientId?.trim()) {
    return NextResponse.json({ error: "syntheticPatientId is required." }, { status: 400 });
  }
  if (!Array.isArray(body.items) || !body.items.length) {
    return NextResponse.json({ error: "items must be a non-empty string array." }, { status: 400 });
  }

  const tenant = resolveTenantContext(request, auth.context);
  const actor = auth.context.userEmail ?? auth.context.userId;
  const storeKey = `practice_${tenant.practiceId}`.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);

  try {
    const result = await stageAndPersistLabPharmacyDraft(
      {
        kind: body.kind,
        syntheticPatientId: body.syntheticPatientId,
        items: body.items.map(String),
        title: body.title,
        summary: body.summary,
        careEpisodeId: body.careEpisodeId ?? null,
        caseId: body.caseId ?? null,
        organisationId: body.organisationId ?? tenant.practiceId,
        scopeKey: storeKey,
        actor,
        roleHint: auth.context.clinicalPersona ?? auth.context.userRole,
      },
      {
        role: auth.context.userRole,
        persona: auth.context.clinicalPersona,
        practiceId: tenant.practiceId,
      }
    );

    return NextResponse.json({
      ...LAB_PHARMACY_HITL_HONESTY,
      ok: true,
      draft: result.draft,
      source: result.source,
      shieldLogged: result.shieldLogged,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stage failed";
    const status = /Forbidden/i.test(message) ? 403 : 400;
    return NextResponse.json({ error: message, ...LAB_PHARMACY_HITL_HONESTY }, { status });
  }
}
