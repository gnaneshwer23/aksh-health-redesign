"use client";

import { useEffect } from "react";

import { reportClientError } from "@/lib/observability/client";

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => reportClientError(error), [error]);
  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center" role="alert">
      <h1 className="text-xl font-semibold text-foreground">Something went wrong on this page</h1>
      <p className="mt-2 text-sm text-muted">
        The error has been recorded for our team. Nothing you entered has been sent anywhere else. If a patient needs urgent help, use your usual emergency
        route, not this screen.
      </p>
      {error.digest ? <p className="mt-2 font-mono text-xs text-muted">Reference: {error.digest}</p> : null}
      <div className="mt-6 flex justify-center gap-3">
        <button type="button" onClick={reset} className="rounded-full bg-foreground px-5 py-2 text-sm text-background">Try again</button>
        <a href="/" className="rounded-full border border-border-subtle px-5 py-2 text-sm text-foreground">Home</a>
      </div>
    </main>
  );
}
