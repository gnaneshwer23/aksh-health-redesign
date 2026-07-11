type ErrorContext = Record<string, unknown>;

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return { message: String(error) };
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
    ...context,
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
