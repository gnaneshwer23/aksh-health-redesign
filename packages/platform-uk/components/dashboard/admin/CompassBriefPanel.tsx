"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import type { EquityDraft } from "@/lib/agents/llm-equity";
import { POPULATION_SUPPRESSION_DISCLOSURE } from "@/lib/precision-health/population-suppression";

/**
 * P2-COMPASS-01 — thin ICS/admin UX over COMPASS (equity) API.
 * Aggregate / small-cell honesty only; HITL; no EHR write. Does not rebuild population health.
 */
export function CompassBriefPanel() {
  const { status } = useSession();
  const [draft, setDraft] = useState<EquityDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [shieldLogged, setShieldLogged] = useState<boolean | null>(null);

  const generate = async () => {
    if (status !== "authenticated") {
      toast({
        title: "Sign in required",
        description: "COMPASS population briefs require an authenticated admin/ICS session.",
      });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/agents/compass", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        toast({ title: "COMPASS unavailable", description: `HTTP ${res.status}` });
        return;
      }
      const payload = (await res.json()) as {
        draft: EquityDraft;
        shieldLogged?: boolean;
        hitlRequired?: boolean;
        ehrWrite?: boolean;
      };
      setDraft(payload.draft);
      setShieldLogged(payload.shieldLogged ?? null);
      toast({
        title: "COMPASS brief ready",
        description: `${payload.draft.mode}/${payload.draft.dataSource} · HITL · ehrWrite:false · small cells suppressed`,
      });
    } catch {
      toast({ title: "COMPASS request failed", description: "Try again when signed in." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      className="rounded-lg border border-border bg-surface-raised/40 p-4 space-y-3"
      data-testid="admin-compass-brief"
    >
      <div className="space-y-1">
        <h2 className="text-sm font-semibold tracking-tight">COMPASS population brief</h2>
        <p className="text-xs text-muted">
          On-request aggregate brief via /api/agents/compass (EQUITY alias). Not patient-level.{" "}
          {POPULATION_SUPPRESSION_DISCLOSURE}
        </p>
      </div>
      <Button type="button" size="sm" disabled={busy} onClick={() => void generate()}>
        {busy ? "Generating…" : "Generate COMPASS brief"}
      </Button>
      {draft ? (
        <div className="space-y-2 text-xs" data-testid="admin-compass-brief-result">
          <p className="font-medium text-foreground">{draft.summary}</p>
          <p className="text-muted">
            Mode: {draft.mode} · Source: {draft.dataSource} · Flags: {draft.equityFlags} · Confidence:{" "}
            {draft.confidence}
            {shieldLogged != null ? ` · SHIELD: ${shieldLogged ? "logged" : "write failed"}` : ""}
          </p>
          {draft.priorities.length > 0 ? (
            <ul className="list-disc pl-4 text-muted space-y-0.5">
              {draft.priorities.slice(0, 5).map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          ) : null}
          <ul className="list-disc pl-4 text-amber-900/80 space-y-0.5">
            {draft.safetyNotes.slice(0, 4).map((n) => (
              <li key={n}>{n}</li>
            ))}
            <li>HITL Accept/Edit/Reject required before operational staging · ehrWrite:false</li>
          </ul>
        </div>
      ) : null}
    </section>
  );
}
