import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import type { NextResponse } from "next/server";
import { NextResponse as ServerNextResponse } from "next/server";

import { authOptions } from "./auth";
import type { AppRole } from "./permission-matrix";

export const userScopeCookieName = "aksh_uid";

const scopeKeyPattern = /^[a-zA-Z0-9_-]{3,64}$/;

function sanitizeScopeKey(raw: string | null | undefined) {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!scopeKeyPattern.test(trimmed)) return null;
  return trimmed;
}

function parseCookieValue(cookieHeader: string | null, key: string) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((part) => part.trim());
  const match = parts.find((part) => part.startsWith(`${key}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(key.length + 1));
}

function createScopeKey() {
  return `usr_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

const OPERATIONS_APP_ROLES = new Set(["operations_lead", "practice-manager", "ics-lead", "hospital-executive"]);
const CLINICAL_APP_ROLES = new Set(["clinical_reviewer", "gp", "nurse", "clinical-pharmacist"]);

/**
 * Map a raw session/onboarding role string to a first-class `AppRole` (OQ-PER-1/OQ-PER-2).
 * `patient` and `researcher` are scoped explicitly rather than falling through to
 * `clinical_reviewer`; any unrecognized role denies by default via `"restricted"` instead of
 * being silently promoted to a clinical/ops AppRole.
 */
export function mapSessionRoleToAppRole(role: string | null | undefined): AppRole {
  const normalized = role?.trim();
  if (!normalized) return "restricted";
  if (OPERATIONS_APP_ROLES.has(normalized)) return "operations_lead";
  if (CLINICAL_APP_ROLES.has(normalized)) return "clinical_reviewer";
  if (normalized === "patient") return "patient";
  if (normalized === "researcher") return "researcher";
  return "restricted";
}

export function resolveUserScope(request: Request) {
  const authenticatedUserId = sanitizeScopeKey(request.headers.get("x-user-id"));
  if (authenticatedUserId) {
    return { scopeKey: authenticatedUserId, shouldSetCookie: false };
  }

  const cookieScope = sanitizeScopeKey(parseCookieValue(request.headers.get("cookie"), userScopeCookieName));
  if (cookieScope) {
    return { scopeKey: cookieScope, shouldSetCookie: false };
  }

  return { scopeKey: createScopeKey(), shouldSetCookie: true };
}

export function applyUserScopeCookie(response: NextResponse, scopeKey: string) {
  response.cookies.set({
    name: userScopeCookieName,
    value: scopeKey,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export function readUserScopeFromServerCookies() {
  const store = cookies();
  return sanitizeScopeKey(store.get(userScopeCookieName)?.value) ?? "shared";
}

export async function readUserScopeFromServerContext() {
  const store = cookies();
  const cookieScope = sanitizeScopeKey(store.get(userScopeCookieName)?.value);

  if (cookieScope) {
    return cookieScope;
  }

  const session = await getServerSession(authOptions);
  return resolveAuthenticatedUserScopeFromSession(session)?.scopeKey ?? "shared";
}

export type AuthenticatedUserScope = {
  scopeKey: string;
  userId: string;
  userEmail: string | null;
  userRole: AppRole;
  /**
   * Bound patient id for a `patient`-role session (FR-CORE-005, `evaluatePatientUrlAccess`).
   * `null` for every other role, and — honestly — `null` for a real `patient` session today too,
   * since no session/JWT callback currently populates it (Volume I OQ-PER-4/OQ-CORE-1, restated
   * B5 docs/PHASED_BUILD_PLAN.md): a patient-scoped write fails closed (403) rather than silently
   * allowing it or guessing a bound record. The test-auth header path below (`x-bound-patient-id`)
   * exists only under the same `AKSH_TEST_AUTH_HEADER` gate as `x-user-id`/`x-user-role`, so it can
   * never be used to spoof a bound patient id against a real NextAuth session.
   */
  boundPatientId: string | null;
};

export function resolveAuthenticatedUserScopeFromSession(session: {
  user?: {
    id?: string | null;
    email?: string | null;
    role?: string | null;
    boundPatientId?: string | null;
  } | null;
} | null | undefined): AuthenticatedUserScope | null {
  const userId = sanitizeScopeKey(session?.user?.id);

  if (!userId) {
    return null;
  }

  return {
    scopeKey: userId,
    userId,
    userEmail: session?.user?.email?.trim() || null,
    userRole: mapSessionRoleToAppRole(session?.user?.role),
    boundPatientId: session?.user?.boundPatientId?.trim() || null,
  };
}

function resolveTestAuthenticatedUserScope(request: Request | undefined): AuthenticatedUserScope | null {
  if (!request || process.env.AKSH_TEST_AUTH_HEADER !== "true" || process.env.NODE_ENV === "production") {
    return null;
  }

  const userId = sanitizeScopeKey(request.headers.get("x-user-id"));
  if (!userId) {
    return null;
  }

  const roleHeader = request.headers.get("x-user-role");
  return {
    scopeKey: userId,
    userId,
    userEmail: request.headers.get("x-user-email")?.trim() || null,
    userRole: mapSessionRoleToAppRole(roleHeader),
    // Test-only: gated by the same AKSH_TEST_AUTH_HEADER check as x-user-id/x-user-role above,
    // so this can never be used to spoof a bound patient id against a real NextAuth session.
    boundPatientId: request.headers.get("x-bound-patient-id")?.trim() || null,
  };
}

export async function requireAuthenticatedUserScope(request?: Request) {
  const testContext = resolveTestAuthenticatedUserScope(request);
  if (testContext) {
    return {
      context: testContext,
      response: null,
    };
  }

  try {
    const session = await getServerSession(authOptions);
    const context = resolveAuthenticatedUserScopeFromSession(session);

    if (!context) {
      return {
        context: null,
        response: ServerNextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }

    return {
      context,
      response: null,
    };
  } catch {
    return {
      context: null,
      response: ServerNextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
}

/**
 * E2 (docs/PHASED_BUILD_PLAN_E.md, implements
 * docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md P3-2): additive role-gate helper
 * on top of `requireAuthenticatedUserScope`. Denies (403) any authenticated
 * caller whose `AppRole` is not in `allowedRoles`, using the exact allow-list
 * the caller passes in — this function does not itself decide who may access
 * what; it only enforces a decision already made elsewhere (e.g. the
 * `export_system_contracts`/`governance_pack_view` rows already documented
 * in `lib/permission-matrix.ts`). Does not change `requireAuthenticatedUserScope`
 * or `resolveOptionalAuthenticatedUserScope`'s own behaviour in any way.
 */
export async function requireAppRole(request: Request | undefined, allowedRoles: AppRole[]) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) {
    return auth;
  }

  if (!allowedRoles.includes(auth.context.userRole)) {
    return {
      context: null,
      response: ServerNextResponse.json(
        { error: `Forbidden. Role "${auth.context.userRole}" is not permitted for this resource.` },
        { status: 403 }
      )
    };
  }

  return auth;
}

export async function resolveOptionalAuthenticatedUserScope(
  request?: Request
): Promise<AuthenticatedUserScope | null> {
  const testContext = resolveTestAuthenticatedUserScope(request);
  if (testContext) {
    return testContext;
  }

  try {
    const session = await getServerSession(authOptions);
    return resolveAuthenticatedUserScopeFromSession(session);
  } catch {
    return null;
  }
}
