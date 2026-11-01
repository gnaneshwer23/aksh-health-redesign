"use client";

import { useMemo } from "react";

import { buildDirectoryRegisterAlignment } from "@/lib/agents/directory-honesty";

/**
 * Milestone C5 — directory / register / ops path-kind alignment (scaffold · live-path · sim).
 * Never claims production ready.
 */
export function DirectoryHonestyPanel() {
  const rows = useMemo(() => buildDirectoryRegisterAlignment(), []);
  const peers = rows.filter((r) => r.inDirectory);
  const adjacent = rows.filter((r) => !r.inDirectory);

  return (
    <section
      className="rounded-lg border border-border bg-surface-raised/40 p-4 space-y-3"
      data-testid="directory-honesty-panel"
    >
      <div className="space-y-1">
        <h2 className="text-sm font-semibold tracking-tight">Directory ↔ register alignment</h2>
        <p className="text-xs text-muted">
          Status agrees across agent directory, register, and this ops list.{" "}
          <strong>live-path</strong> means product surface — not production ready.{" "}
          <strong>scaffold</strong> / <strong>sim</strong> are evaluation-only.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" data-testid="directory-honesty-peers">
        {peers.map((row) => (
          <div
            key={row.id}
            className="rounded-md border border-border px-3 py-2 text-xs space-y-1"
            data-agent-id={row.id}
            data-path-kind={row.pathKind}
            data-aligned={row.aligned ? "true" : "false"}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-medium">{row.id}</span>
              <span
                className={
                  row.pathKind === "scaffold"
                    ? "text-amber-800"
                    : row.pathKind === "sim"
                      ? "text-sky-800"
                      : "text-muted"
                }
              >
                {row.pathKind}
              </span>
            </div>
            <div className="text-muted">
              dir: {row.directoryStatus} · reg: {row.registerStatus}
              {row.directoryLive ? " · surface" : " · not live"}
            </div>
            <p className="text-[11px] text-muted">{row.honestyLabel}</p>
            <p className="text-[11px] text-muted">{row.note}</p>
          </div>
        ))}
      </div>
      <div className="space-y-2" data-testid="directory-honesty-adjacent">
        <h3 className="text-xs font-semibold">Sub-capabilities &amp; adjacent (not directory peers)</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {adjacent.map((row) => (
            <div
              key={row.id}
              className="rounded-md border border-dashed border-border px-3 py-2 text-xs space-y-1"
              data-agent-id={row.id}
              data-path-kind={row.pathKind}
            >
              <div className="font-medium">{row.id}</div>
              <p className="text-[11px] text-muted">{row.honestyLabel}</p>
              <p className="text-[11px] text-muted">{row.note}</p>
            </div>
          ))}
        </div>
      </div>
      <p className="text-[11px] text-muted" data-testid="directory-honesty-no-production">
        No agent is labelled production ready. Meeting numeric readiness targets does not release an agent.
      </p>
    </section>
  );
}
