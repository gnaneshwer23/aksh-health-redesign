"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * U4 — One-click hero demo path for GP: review queue → Accept → BRIDGE export/sim.
 * Honest: HITL mandatory · liveEmis:false · D1 Bundle export is handoff, not live EHR write.
 */
const BEATS = [
  {
    n: "1",
    label: "Review queue",
    href: "/dashboard/gp/review-queue",
    hint: "Open pending drafts",
  },
  {
    n: "2",
    label: "Accept (HITL)",
    href: "/review/pilot?demo=1",
    hint: "Clinician gate · SHIELD",
  },
  {
    n: "3",
    label: "Export / sim",
    href: "/cases/case-005/evidence?demo=1",
    hint: "BRIDGE FHIR Bundle · liveEmis:false",
  },
] as const;

export function GpHeroDemoPath({ className }: { className?: string }) {
  return (
    <section
      aria-label="GP hero demo path"
      data-testid="gp-hero-demo-path"
      className={cn(
        "rounded-xl border border-primary/20 bg-primary/[0.04] px-4 py-3 text-sm shadow-sm",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
              Hero demo · &lt;10 min
            </p>
            <Badge variant="outline" className="text-[10px]">
              liveEmis:false
            </Badge>
          </div>
          <p className="text-xs text-muted">
            Capture → draft → approve on the GP surface. Agents draft; you Accept; BRIDGE stages FHIR
            (Neon/file) and Bundle export is handoff — not a live EMIS write.
          </p>
          <ol className="flex flex-wrap items-stretch gap-2" aria-label="Demo beats">
            {BEATS.map((beat, i) => (
              <li key={beat.n} className="flex items-center gap-2">
                <Link
                  href={beat.href}
                  className="inline-flex min-w-[9.5rem] flex-col rounded-lg border border-border-subtle bg-card px-3 py-2 transition hover:border-primary/40 hover:bg-primary/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  data-testid={`gp-hero-beat-${beat.n}`}
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
          <Link href="/demo/script" data-testid="gp-hero-demo-script">
            Full demo script
          </Link>
        </Button>
      </div>
    </section>
  );
}
