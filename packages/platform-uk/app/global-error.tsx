"use client";

import { useEffect } from "react";

import { reportClientError } from "@/lib/observability/client";

/** Last-resort boundary when the root layout itself fails: plain markup, no app styles or providers. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => reportClientError(error), [error]);
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#fff", color: "#111", margin: 0 }}>
        <main style={{ maxWidth: 520, margin: "64px auto", padding: "0 16px", textAlign: "center" }} role="alert">
          <h1 style={{ fontSize: 20 }}>Aksh could not load</h1>
          <p style={{ fontSize: 14, color: "#555" }}>The error has been recorded for our team. If a patient needs urgent help, use your usual emergency route.</p>
          {error.digest ? <p style={{ fontFamily: "monospace", fontSize: 12, color: "#555" }}>Reference: {error.digest}</p> : null}
          <button type="button" onClick={reset} style={{ marginTop: 16, padding: "8px 20px", borderRadius: 999, border: "1px solid #111", background: "#111", color: "#fff" }}>Try again</button>
        </main>
      </body>
    </html>
  );
}
