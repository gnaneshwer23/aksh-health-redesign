"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * U8 — Researcher demo: ethics → evaluation → data access.
 * ATLAS Phase 2 (not live) · COMPASS / SHIELD supporting · synthetic · liveEmis:false.
 */
const BEATS = [
  {
    n: "1",
    label: "Ethics",
    href: "/dashboard/researcher",
    hint: "Empty-state · aggregate default",
  },
  {
    n: "2",
    label: "Evaluation",
    href: "/dashboard/researcher/evaluation",
    hint: "Cohort KPIs · SHIELD export",
  },
  {
    n: "3",
    label: "Data access",
    href: "/dashboard/researcher/data-access",
    hint: "COMPASS · ethics gates",
  },
] as const;

export function ResearcherHeroDemoPath({ className }: { className?: string }) {
  return (
    <section
      aria-label="Researcher hero demo path"
      data-testid="researcher-hero-demo-path"
      className={cn(
        "rounded-xl border border-[#E67E22]/30 bg-[#E67E22]/[0.04] px-4 py-3 text-sm shadow-sm",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
              Research demo · ethics / evaluation
            </p>
            <Badge variant="outline" className="text-[10px]">
              liveEmis:false
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              ATLAS Phase 2
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              synthetic cohorts
            </Badge>
          </div>
          <p className="text-xs text-muted">
            Ethics → evaluation → data access. COMPASS / SHIELD support governed aggregates and audited
            exports. ATLAS stays Phase 2 (not live) — never claim a live research agent. No patient-level
            spill by default · liveEmis:false.
          </p>
          <ol className="flex flex-wrap items-stretch gap-2" aria-label="Demo beats">
            {BEATS.map((beat, i) => (
              <li key={beat.n} className="flex items-center gap-2">
                <Link
                  href={beat.href}
                  className="inline-flex min-w-[9.5rem] flex-col rounded-lg border border-border-subtle bg-card px-3 py-2 transition hover:border-[#E67E22]/40 hover:bg-[#E67E22]/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E67E22]"
                  data-testid={`researcher-hero-beat-${beat.n}`}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-[#E67E22]">
                    {beat.n} · {beat.label}
                  </span>
                  <span className="text-[10px] text-muted">{beat.hint}</span>
                </Link>
                {i < BEATS.length - 1 ? (
                  <span className="hidden text-muted sm:inline" aria-hidden>
                    →
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
        <Button size="sm" variant="outline" asChild className="shrink-0">
          <Link href="/demo/script" data-testid="researcher-hero-demo-script">
            Full demo script
          </Link>
        </Button>
      </div>
    </section>
  );
}
