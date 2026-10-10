"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * U8 — Patient companion demo: My Health → care plan → consent.
 * Invite-by-practice · clinicians keep HITL · synthetic · liveEmis:false.
 */
const BEATS = [
  {
    n: "1",
    label: "My Health",
    href: "/dashboard/patient#companion-my-health",
    hint: "Conditions · care team",
  },
  {
    n: "2",
    label: "Care plan",
    href: "/dashboard/patient#companion-care-plan",
    hint: "DRAFT · GP approves",
  },
  {
    n: "3",
    label: "Consent",
    href: "/dashboard/patient#companion-consent",
    hint: "Purpose grants · SHIELD",
  },
] as const;

export function PatientHeroDemoPath({ className }: { className?: string }) {
  return (
    <section
      aria-label="Patient hero demo path"
      data-testid="patient-hero-demo-path"
      className={cn(
        "rounded-xl border border-accent/25 bg-accent/[0.04] px-4 py-3 text-sm shadow-sm",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
              Companion demo · patient
            </p>
            <Badge variant="outline" className="text-[10px]">
              liveEmis:false
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              synthetic
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              invite-by-practice
            </Badge>
          </div>
          <p className="text-xs text-muted">
            My Health → care plan → consent. Practice-invited companion — you check in and see plan /
            consent in plain English; clinicians keep HITL on record changes. No patient-app EHR write ·
            liveEmis:false.
          </p>
          <ol className="flex flex-wrap items-stretch gap-2" aria-label="Demo beats">
            {BEATS.map((beat, i) => (
              <li key={beat.n} className="flex items-center gap-2">
                <Link
                  href={beat.href}
                  className="inline-flex min-w-[9.5rem] flex-col rounded-lg border border-border-subtle bg-card px-3 py-2 transition hover:border-accent/40 hover:bg-accent/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  data-testid={`patient-hero-beat-${beat.n}`}
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
          <Link href="/demo/script" data-testid="patient-hero-demo-script">
            Full demo script
          </Link>
        </Button>
      </div>
    </section>
  );
}
