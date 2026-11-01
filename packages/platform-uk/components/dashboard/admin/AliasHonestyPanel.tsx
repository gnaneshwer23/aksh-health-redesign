"use client";

import { ALIAS_HONESTY_LINES, listAliasHonestyRows } from "@/lib/agents/alias-honesty";

/**
 * Milestone C5 — VOICE vs VOICE CARE + ORACLE/EQUITY/REFERRAL alias clarity for Agent Ops.
 */
export function AliasHonestyPanel() {
  const rows = listAliasHonestyRows();
  return (
    <section
      className="rounded-lg border border-border bg-surface-raised/40 p-4 space-y-3"
      data-testid="alias-honesty-panel"
    >
      <div className="space-y-1">
        <h2 className="text-sm font-semibold tracking-tight">Alias honesty</h2>
        <p className="text-xs text-muted">
          Product labels vs legacy API ids — Week 2 HCP edge clarity. No separate live agents for renamed ids.
        </p>
      </div>
      <ul className="text-[11px] text-muted space-y-1 list-disc pl-4" data-testid="alias-honesty-lines">
        {ALIAS_HONESTY_LINES.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <div
            key={`${row.productLabel}-${row.legacyOrAdjacent}`}
            className="rounded-md border border-border px-3 py-2 text-xs space-y-1"
            data-alias-kind={row.kind}
            data-product-label={row.productLabel}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-medium">{row.productLabel}</span>
              <span className="text-muted">{row.kind}</span>
            </div>
            <div className="text-muted">{row.legacyOrAdjacent}</div>
            <p className="text-[11px] text-muted">{row.note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
