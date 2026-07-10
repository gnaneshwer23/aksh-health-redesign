import type { NextRequest } from "next/server";

import type { AuthenticatedUserScope } from "../user-scope";

export type TenantContext = {
  practiceId: string;
  scopeKey: string;
  userId?: string;
};

const DEFAULT_PRACTICE_ID = "practice-demo";

export function resolvePracticeId(request?: Request | NextRequest, auth?: AuthenticatedUserScope | null) {
  const headerPractice = request?.headers.get("x-practice-id")?.trim();
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
