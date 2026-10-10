import { isSimulationRequest } from "@/lib/env/simulation";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

const SIGNUP_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 };
const FORGOT_PASSWORD_LIMIT = { limit: 3, windowMs: 60 * 60 * 1000 };

function isRateLimitDisabled() {
  return process.env.DISABLE_RATE_LIMIT === "true" || process.env.CI === "true";
}

export function enforceSignupRateLimit(request: Request) {
  if (isRateLimitDisabled() || isSimulationRequest(request)) return null;

  const ip = getClientIp(request);
  const result = checkRateLimit(`signup:${ip}`, SIGNUP_LIMIT.limit, SIGNUP_LIMIT.windowMs);

  if (!result.success) {
    return rateLimitResponse(result, "Too many signup attempts from this network. Please try again in an hour.");
  }

  return null;
}

export function enforceForgotPasswordRateLimit(request: Request) {
  if (isRateLimitDisabled()) return null;

  const ip = getClientIp(request);
  const result = checkRateLimit(
    `forgot-password:${ip}`,
    FORGOT_PASSWORD_LIMIT.limit,
    FORGOT_PASSWORD_LIMIT.windowMs
  );

  if (!result.success) {
    return rateLimitResponse(
      result,
      "Too many password reset requests from this network. Please try again in an hour."
    );
  }

  return null;
}
