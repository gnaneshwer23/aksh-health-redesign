import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "../../../../lib/auth";
import { buildResearchEvaluationArtifact } from "../../../../lib/research-evaluation-plan";
import { buildUserProfile } from "../../../../lib/profile/user-profile";
import { toOrgSlug } from "../../../../lib/profile/personalization";
import { persistShieldAuditEvent } from "../../../../lib/repositories/shield-audit-repository";
import { requireAuthenticatedUserScope } from "../../../../lib/user-scope";

/**
 * E3 (docs/PHASED_BUILD_PLAN_E.md, P3-4) exports this set so
 * `app/api/research/federated/jobs/route.ts` can reuse it verbatim — a
 * single source of truth for "who may touch research-workspace surfaces,"
 * rather than a second, independently-maintained allow-list.
 */
export const RESEARCH_EVALUATION_ROLES = new Set([
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

function resolveTestProfile(request: Request) {
  if (process.env.AKSH_TEST_AUTH_HEADER !== "true" || process.env.NODE_ENV === "production") {
    return null;
  }

  const userId = request.headers.get("x-user-id")?.trim();
  if (!userId) return null;

  return {
    userId,
    email: request.headers.get("x-user-email")?.trim() || null,
    role: (request.headers.get("x-user-role")?.trim() || "researcher") as Parameters<typeof buildUserProfile>[0]["role"],
    fullName: request.headers.get("x-user-name")?.trim() || null,
    organisation: request.headers.get("x-user-organisation")?.trim() || null,
    onboardingComplete: true,
  };
}

/**
 * E3 (docs/PHASED_BUILD_PLAN_E.md, P3-4): exported so
 * `app/api/research/federated/jobs/route.ts` can reuse the exact same
 * test-header + real-session role check, rather than re-deriving role
 * resolution against a different (AppRole-mapped) model.
 */
export async function canAccessResearchEvaluation(request?: Request): Promise<boolean> {
  const testRole = resolveRequestRole(request);
  if (testRole) {
    return RESEARCH_EVALUATION_ROLES.has(testRole);
  }

  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  return Boolean(session?.user?.id && role && RESEARCH_EVALUATION_ROLES.has(role));
}

async function resolveExportOrgSlug(request: Request): Promise<string> {
  const testProfile = resolveTestProfile(request);
  if (testProfile) {
    const profile = await buildUserProfile(testProfile);
    return toOrgSlug(profile.organisation);
  }

  const session = await getServerSession(authOptions);
  if (session?.user?.id && session.user.role) {
    const profile = await buildUserProfile({
      userId: session.user.id,
      email: session.user.email ?? null,
      role: session.user.role,
      fullName: session.user.name ?? null,
      organisation: session.user.organisation ?? null,
      onboardingComplete: session.user.onboardingComplete,
    });
    return toOrgSlug(profile.organisation);
  }

  return "aksh";
}

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const allowed = await canAccessResearchEvaluation(request);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden. Researcher or admin role required." }, { status: 403 });
  }

  const { userEmail, scopeKey } = auth.context;
  const generatedBy = userEmail || scopeKey;
  const artifact = buildResearchEvaluationArtifact({ generatedBy });
  const orgSlug = await resolveExportOrgSlug(request);
  const filename = `${orgSlug}-research-evaluation-boundary.json`;

  void persistShieldAuditEvent({
    action: "export",
    actor: generatedBy,
    label: "SHIELD: researcher evaluation JSON exported",
    detail: filename,
    category: "system",
    agentLabel: "SHIELD",
    resourceRef: `research-evaluation/${orgSlug}`,
    payload: { syntheticOnly: true, filename }
  });

  return NextResponse.json(artifact, {
    headers: {
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
