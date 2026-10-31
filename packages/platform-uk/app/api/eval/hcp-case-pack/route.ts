/**
 * Milestone B — synthetic HCP evaluation case pack (read-only).
 */
import { NextResponse } from "next/server";

import { getHcpCasePackManifest, listHcpEvalCases, type HcpCaseKind } from "@/lib/eval/hcp-case-pack";
import { AGENT_OPS_ROLES, REVIEW_DECISION_ROLES } from "@/lib/security/agent-authz";
import { requireAppRole } from "@/lib/user-scope";

export const dynamic = "force-dynamic";

const CASE_KINDS = new Set<HcpCaseKind>([
  "core_loop",
  "hazard_drug_interaction",
  "hazard_prompt_injection",
  "missing_labs",
  "urgent_hypoglycaemia",
  "small_cell_equity",
  "pathway_staging",
  "diabetes_connected",
]);

const READ_ROLES = [...new Set([...AGENT_OPS_ROLES, ...REVIEW_DECISION_ROLES])];

export async function GET(request: Request) {
  const auth = await requireAppRole(request, READ_ROLES);
  if (auth.response || !auth.context) return auth.response;

  const url = new URL(request.url);
  const kindRaw = url.searchParams.get("kind")?.trim() as HcpCaseKind | undefined;
  if (kindRaw && !CASE_KINDS.has(kindRaw)) {
    return NextResponse.json(
      { error: `kind must be one of: ${[...CASE_KINDS].join(", ")}` },
      { status: 400 }
    );
  }

  const manifest = getHcpCasePackManifest();
  const cases = kindRaw ? listHcpEvalCases(kindRaw) : manifest.cases;

  return NextResponse.json({
    ...manifest,
    cases,
    caseCount: cases.length,
    filteredKind: kindRaw ?? null,
    ehrWrite: false,
    hitlRequired: true,
    liveEmis: false,
  });
}
