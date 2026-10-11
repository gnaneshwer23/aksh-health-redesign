type ErrorContext = Record<string, unknown>;

import { scrub } from "./observability/errors";

/** Scrubbed like aksh.error_events: no emails, numbers, dates, identifiers or SQL key values reach the logs. */
function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: scrub(error.name, 80),
      message: scrub(error.message, 500),
      stack: error.stack ? scrub(error.stack, 2000) : undefined,
    };
  }

  return { message: scrub(String(error), 500) };
}

/**
 * Structured server-side error reporting. When SENTRY_DSN is set, logs include a hint
 * for Vercel/Sentry integration. Add @sentry/nextjs and wire captureException here if
 * full Sentry SDK support is needed later.
 */
export function reportError(error: unknown, context: ErrorContext = {}) {
  const payload = {
    level: "error",
    timestamp: new Date().toISOString(),
    sentryEnabled: Boolean(process.env.SENTRY_DSN?.trim()),
    error: serializeError(error),
    // Context keys are kept; string values are scrubbed (they may carry user input).
    ...Object.fromEntries(Object.entries(context).map(([k, v]) => [k, typeof v === "string" ? scrub(v, 300) : v])),
  };

  console.error(JSON.stringify(payload));
}

export function reportWarning(message: string, context: ErrorContext = {}) {
  console.warn(
    JSON.stringify({
      level: "warn",
      timestamp: new Date().toISOString(),
      message,
      ...context,
    })
  );
}
