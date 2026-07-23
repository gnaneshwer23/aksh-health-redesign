"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * U5 — One-click 3-beat nurse demo: vitals → handover → GUARDIAN alerts.
 * Honest: HITL confirmation · spine nurse-vitals when signed in · liveEmis:false.
 */
const BEATS = [
  {
    n: "1",
    label: "Vitals + timeline",
    href: "/dashboard/nurse/observations",
    hint: "CANVAS capture · nurse-vitals spine",
  },
  {
    n: "2",
    label: "Handover draft",
    href: "/dashboard/nurse/handover",
    hint: "SYNTHESIS draft · you confirm",
  },
  {
    n: "3",
    label: "GUARDIAN alerts",
    href: "/dashboard/nurse/alerts",
    hint: "Safety follow-up · SHIELD audit",
  },
] as const;

export function NurseHeroDemoPath({ className }: { className?: string }) {
  return (
    <section
      aria-label="Nurse hero demo path"
      data-testid="nurse-hero-demo-path"
      className={cn(
        "rounded-xl border border-secondary/25 bg-secondary/[0.04] px-4 py-3 text-sm shadow-sm",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
              3-beat demo · nurse
            </p>
            <Badge variant="outline" className="text-[10px]">
              liveEmis:false
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              synthetic
            </Badge>
          </div>
          <p className="text-xs text-muted">
            Observations → handover → GUARDIAN. Agents draft; you confirm. Signed-in vitals append to
            the shared clinical spine timeline (SHIELD) — never a live EMIS / SystmOne write.
          </p>
          <ol className="flex flex-wrap items-stretch gap-2" aria-label="Demo beats">
            {BEATS.map((beat, i) => (
              <li key={beat.n} className="flex items-center gap-2">
                <Link
                  href={beat.href}
                  className="inline-flex min-w-[9.5rem] flex-col rounded-lg border border-border-subtle bg-card px-3 py-2 transition hover:border-secondary/40 hover:bg-secondary/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                  data-testid={`nurse-hero-beat-${beat.n}`}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-secondary">
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
          <Link href="/demo/script" data-testid="nurse-hero-demo-script">
            Full demo script
          </Link>
        </Button>
      </div>
    </section>
  );
}
