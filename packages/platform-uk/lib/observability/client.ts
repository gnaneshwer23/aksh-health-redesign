"use client";

/** Send a crash from an error boundary to our own error log. Best effort: never throws, never retries. */
export function reportClientError(error: Error & { digest?: string }) {
  try {
    const body = JSON.stringify({
      name: error.name,
      message: error.message || "(no message)",
      stack: error.stack?.slice(0, 8000),
      digest: error.digest,
      route: window.location.pathname,
    });
    if (navigator.sendBeacon?.("/api/telemetry/error", new Blob([body], { type: "application/json" }))) return;
    void fetch("/api/telemetry/error", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => undefined);
  } catch {
    // Reporting must not cause a second error.
  }
}
