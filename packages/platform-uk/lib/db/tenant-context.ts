import type { NextRequest } from "next/server";

import type { AuthenticatedUserScope } from "../user-scope";

export type TenantContext = {
  practiceId: string;
  scopeKey: string;
  userId?: string;
};

const DEFAULT_PRACTICE_ID = "practice-demo";

export function resolvePracticeId(request?: Request | NextRequest, auth?: AuthenticatedUserScope | null) {
  // The tenant is never chosen by the client. The x-practice-id header is honoured only in E2E test mode outside
  // production, where tests use it to prove cross-practice isolation.
  const testMode = process.env.E2E_TEST_MODE === "true" && process.env.AKSH_ENVIRONMENT !== "production";
  const headerPractice = testMode ? request?.headers.get("x-practice-id")?.trim() : undefined;
  if (headerPractice) {
    return headerPractice;
  }

  return DEFAULT_PRACTICE_ID;
}

export function resolveTenantContext(
  request: Request | NextRequest | undefined,
  auth: AuthenticatedUserScope | null
): TenantContext {
  const practiceId = resolvePracticeId(request, auth);
  const scopeKey = auth?.scopeKey ?? "shared";

  return {
    practiceId,
    scopeKey,
    userId: auth?.userId
  };
}

export function attachPracticeIdToCase<T extends { practiceId?: string }>(payload: T, practiceId: string): T {
  return {
    ...payload,
    practiceId: payload.practiceId ?? practiceId
  };
}
