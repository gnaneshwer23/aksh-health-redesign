import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "../../../../lib/auth";
import { buildResearchEvaluationArtifact } from "../../../../lib/research-evaluation-plan";
import { requireAuthenticatedUserScope } from "../../../../lib/user-scope";

const RESEARCH_EVALUATION_ROLES = new Set([
  "researcher",
  "practice-manager",
  "ics-lead",
  "hospital-executive",
  "operations_lead",
]);

function resolveRequestRole(request: Request | undefined): string | null {
  if (request && process.env.AKSH_TEST_AUTH_HEADER === "true" && process.env.NODE_ENV !== "production") {
    return request.headers.get("x-user-role")?.trim() || null;
  }
  return null;
}

async function canAccessResearchEvaluation(request?: Request): Promise<boolean> {
  const testRole = resolveRequestRole(request);
  if (testRole) {
    return RESEARCH_EVALUATION_ROLES.has(testRole);
  }

  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  return Boolean(session?.user?.id && role && RESEARCH_EVALUATION_ROLES.has(role));
}

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response) return auth.response;

  const allowed = await canAccessResearchEvaluation(request);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden. Researcher or admin role required." }, { status: 403 });
  }

  const { userEmail, scopeKey } = auth.context;
  const generatedBy = userEmail || scopeKey;
  const artifact = buildResearchEvaluationArtifact({ generatedBy });
  const response = NextResponse.json(artifact, {
    headers: {
      "Content-Disposition": 'attachment; filename="aksh-uk-eu-research-evaluation-boundary.json"',
    },
  });

  return response;
}
