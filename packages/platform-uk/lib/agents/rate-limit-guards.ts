/**
 * Milestone A4 — rate limits for critical agent invoke / review / ops APIs.
 * Reuses shared checkRateLimit (Postgres window with memory fallback).
 */
import { isSimulationRequest } from "@/lib/env/simulation";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

const AGENT_INVOKE = { limit: 30, windowMs: 60 * 1000 };
const REVIEW_DECISION = { limit: 60, windowMs: 60 * 1000 };
const OPS_READ = { limit: 120, windowMs: 60 * 1000 };
const REVIEW_ASSIGN = { limit: 40, windowMs: 60 * 1000 };

function isRateLimitDisabled() {
  return process.env.DISABLE_RATE_LIMIT === "true" || process.env.CI === "true";
}

export async function enforceAgentInvokeRateLimit(
  request: Request,
  userId: string
) {
  if (isRateLimitDisabled() || isSimulationRequest(request)) return null;
  const ip = getClientIp(request);
  const byUser = await checkRateLimit(
    `agent-invoke:user:${userId}`,
    AGENT_INVOKE.limit,
    AGENT_INVOKE.windowMs
  );
  if (!byUser.success) {
    return rateLimitResponse(
      byUser,
      "Too many agent invocations. Slow down and retry shortly."
    );
  }
  const byIp = await checkRateLimit(
    `agent-invoke:ip:${ip}`,
    AGENT_INVOKE.limit * 2,
    AGENT_INVOKE.windowMs
  );
  if (!byIp.success) {
    return rateLimitResponse(
      byIp,
      "Too many agent invocations from this network. Slow down and retry shortly."
    );
  }
  return null;
}

export async function enforceReviewDecisionRateLimit(
  request: Request,
  userId: string
) {
  if (isRateLimitDisabled() || isSimulationRequest(request)) return null;
  const result = await checkRateLimit(
    `review-decision:${userId}`,
    REVIEW_DECISION.limit,
    REVIEW_DECISION.windowMs
  );
  if (!result.success) {
    return rateLimitResponse(
      result,
      "Too many review decisions in a short window. Wait and retry."
    );
  }
  return null;
}

export async function enforceOpsRunsRateLimit(request: Request, userId: string) {
  if (isRateLimitDisabled() || isSimulationRequest(request)) return null;
  const result = await checkRateLimit(
    `agent-ops-runs:${userId}`,
    OPS_READ.limit,
    OPS_READ.windowMs
  );
  if (!result.success) {
    return rateLimitResponse(
      result,
      "Too many Agent Ops reads. Wait a minute and retry."
    );
  }
  return null;
}

export async function enforceReviewAssignRateLimit(
  request: Request,
  userId: string
) {
  if (isRateLimitDisabled() || isSimulationRequest(request)) return null;
  const result = await checkRateLimit(
    `review-assign:${userId}`,
    REVIEW_ASSIGN.limit,
    REVIEW_ASSIGN.windowMs
  );
  if (!result.success) {
    return rateLimitResponse(
      result,
      "Too many review-queue assignment changes. Slow down and retry."
    );
  }
  return null;
}
