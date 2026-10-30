"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type UnifiedPayload = {
  primaryCount?: number;
  prepCount?: number;
  assignmentsOpen?: number;
  labReferralDraftStatuses?: { kind: string; status: string }[];
  conductorOps?: {
    total?: number;
    shieldBlockedCount?: number;
    runningCount?: number;
  };
  note?: string;
  error?: string;
};

/**
 * Points authorised GPs at one primary review surface (review-cases / review queue)
 * while acknowledging domain prep worklists without splitting HITL decisions.
 */
export function UnifiedGpReviewBanner({ patientId }: { patientId?: string | null }) {
  const [data, setData] = useState<UnifiedPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/gp/unified-review-worklist", { credentials: "include" })
      .then(async (res) => {
        const json = (await res.json()) as UnifiedPayload;
        if (!cancelled) setData(res.ok ? json : { error: json.error ?? "Unavailable" });
      })
      .catch(() => {
        if (!cancelled) setData({ error: "Could not load unified worklist" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const reviewHref = patientId
    ? `/dashboard/gp/review-queue?patient=${encodeURIComponent(patientId)}`
    : "/dashboard/gp/review-queue";

  return (
    <aside
      className="rounded-xl border border-border-subtle bg-[#f7fafc] px-4 py-3 text-sm"
      data-testid="unified-gp-review-banner"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#1e4d52]">
        Primary GP review worklist
      </p>
      <p className="mt-1 text-foreground">
        Accept / Edit / Reject persist on review cases (CONDUCTOR spine + Guardian-gated diabetes
        drafts). Domain agent-intelligence is prep only — not a second clinical decision queue.
      </p>
      {data && !data.error && (
        <p className="mt-1 text-xs text-muted">
          Open drafts on primary queue: {data.primaryCount ?? 0}
          {typeof data.prepCount === "number" && data.prepCount > 0
            ? ` · ${data.prepCount} domain prep draft(s) not yet mirrored`
            : ""}
          {typeof data.assignmentsOpen === "number" ? ` · assignments: ${data.assignmentsOpen}` : ""}
          {data.conductorOps
            ? ` · CONDUCTOR runs: ${data.conductorOps.total ?? 0} (SHIELD-blocked: ${data.conductorOps.shieldBlockedCount ?? 0})`
            : ""}
          {data.labReferralDraftStatuses?.length
            ? ` · lab/referral drafts: ${data.labReferralDraftStatuses.length}`
            : ""}
        </p>
      )}
      {data?.error && <p className="mt-1 text-xs text-muted">{data.error}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        <Link
          href={reviewHref}
          className="inline-flex items-center rounded-full bg-[#121715] px-3 py-1.5 text-xs font-semibold text-white"
        >
          Open primary review queue
        </Link>
        <Link
          href="/dashboard/gp/agent-intelligence"
          className="inline-flex items-center rounded-full border border-border-subtle bg-white px-3 py-1.5 text-xs font-medium"
        >
          Domain prep (agent intel)
        </Link>
        <Link
          href="/review"
          className="inline-flex items-center rounded-full border border-border-subtle bg-white px-3 py-1.5 text-xs font-medium"
        >
          Case HITL workspace
        </Link>
      </div>
    </aside>
  );
}
