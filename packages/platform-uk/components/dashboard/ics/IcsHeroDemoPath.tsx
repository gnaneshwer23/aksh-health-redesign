"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * U7 — ICS population demo: population → equity (COMPASS) → forecast.
 * Aggregate-only · synthetic cohorts · no patient-level spill · liveEmis:false.
 */
const BEATS = [
  {
    n: "1",
    label: "Population",
    href: "/dashboard/ics/population",
    hint: "KPIs · deprivation overlays",
  },
  {
    n: "2",
    label: "Equity (COMPASS)",
    href: "/dashboard/ics/equity",
    hint: "Flags · action plans",
  },
  {
    n: "3",
    label: "Forecast",
    href: "/dashboard/ics/forecast",
    hint: "HORIZON · not a twin",
  },
] as const;

export function IcsHeroDemoPath({ className }: { className?: string }) {
  return (
    <section
      aria-label="ICS hero demo path"
      data-testid="ics-hero-demo-path"
      className={cn(
        "rounded-xl border border-primary/25 bg-primary/[0.04] px-4 py-3 text-sm shadow-sm",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
              Population demo · ICS lead
            </p>
            <Badge variant="outline" className="text-[10px]">
              liveEmis:false
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              synthetic cohorts
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              aggregate only
            </Badge>
          </div>
          <p className="text-xs text-muted">
            Population → COMPASS equity → forecast. COMPASS leads equity flags; HORIZON / PATHWAY frame
            admission foresight — not a live ICS feed, not patient-level notes, not a physiological twin.
          </p>
          <ol className="flex flex-wrap items-stretch gap-2" aria-label="Demo beats">
            {BEATS.map((beat, i) => (
              <li key={beat.n} className="flex items-center gap-2">
                <Link
                  href={beat.href}
                  className="inline-flex min-w-[9.5rem] flex-col rounded-lg border border-border-subtle bg-card px-3 py-2 transition hover:border-primary/40 hover:bg-primary/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  data-testid={`ics-hero-beat-${beat.n}`}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">
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
          <Link href="/demo/script" data-testid="ics-hero-demo-script">
            Full demo script
          </Link>
        </Button>
      </div>
    </section>
  );
}
