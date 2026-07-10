import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import type { NextResponse } from "next/server";
import { NextResponse as ServerNextResponse } from "next/server";

import { authOptions } from "./auth";

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

export function resolveUserScope(request: Request) {
  // Priority 1: Check for authenticated user ID from NextAuth middleware
  // Format: user-001, user-002, etc. from JWT token
  const authenticatedUserId = request.headers.get("x-user-id");
  if (authenticatedUserId && /^user-\d+/.test(authenticatedUserId)) {
    return { scopeKey: authenticatedUserId, shouldSetCookie: false };
  }

  // Priority 2: Check for x-user-id header from upstream systems
  const headerScope = sanitizeScopeKey(request.headers.get("x-user-id"));
  if (headerScope) {
    return { scopeKey: headerScope, shouldSetCookie: false };
  }

  // Priority 3: Check for existing cookie
  const cookieScope = sanitizeScopeKey(parseCookieValue(request.headers.get("cookie"), userScopeCookieName));
  if (cookieScope) {
    return { scopeKey: cookieScope, shouldSetCookie: false };
  }

  // Fallback: Create new pseudonymous scope (for backward compatibility)
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
    maxAge: 60 * 60 * 24 * 365
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
  userRole: "clinical_reviewer" | "operations_lead";
};

export function resolveAuthenticatedUserScopeFromSession(session: {
  user?: {
    id?: string | null;
    email?: string | null;
    role?: "clinical_reviewer" | "operations_lead" | null;
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
    userRole: session?.user?.role === "operations_lead" ? "operations_lead" : "clinical_reviewer"
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
    userRole: roleHeader === "operations_lead" ? "operations_lead" : "clinical_reviewer"
  };
}

export async function requireAuthenticatedUserScope(request?: Request) {
  const testContext = resolveTestAuthenticatedUserScope(request);
  if (testContext) {
    return {
      context: testContext,
      response: null
    };
  }

  const session = await getServerSession(authOptions);
  const context = resolveAuthenticatedUserScopeFromSession(session);

  if (!context) {
    return {
      context: null,
      response: ServerNextResponse.json({ error: "Unauthorized" }, { status: 401 })
    };
  }

  return {
    context,
    response: null
  };
}
