"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * U4 — One-click hero demo path for GP: review queue → Accept → BRIDGE export/sim.
 * Honest: HITL mandatory · liveEmis:false · D1 Bundle export is handoff, not live EHR write.
 * Quiet chrome: dismissible after first use (also available under TopBar Demo menu).
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

const STORAGE_KEY = "aksh-gp-hero-demo-dismissed";

export function GpHeroDemoPath({
  className,
  forceShow = false,
}: {
  className?: string;
  /** When true, ignore dismiss storage (e.g. review-queue explicit restore). */
  forceShow?: boolean;
}) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (forceShow) {
      setDismissed(false);
      return;
    }
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, [forceShow]);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  if (dismissed) return null;

  return (
    <section
      aria-label="GP hero demo path"
      data-testid="gp-hero-demo-path"
      className={cn(
        "rounded-xl border border-accent/20 bg-accent/[0.04] px-4 py-3 text-sm shadow-sm",
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
            Capture → draft → approve for diabetes / care coordination. Agents draft; you Accept;
            BRIDGE stages FHIR — not a live EHR write.
          </p>
          <ol className="flex flex-wrap items-stretch gap-2" aria-label="Demo beats">
            {BEATS.map((beat, i) => (
              <li key={beat.n} className="flex items-center gap-2">
                <Link
                  href={beat.href}
                  className="inline-flex min-w-[9.5rem] flex-col rounded-lg border border-border-subtle bg-card px-3 py-2 transition hover:border-accent/40 hover:bg-accent/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  data-testid={`gp-hero-beat-${beat.n}`}
                  onClick={dismiss}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-accent">
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
        <div className="flex shrink-0 items-start gap-1">
          <Button size="sm" variant="outline" asChild>
            <Link href="/demo/script" data-testid="gp-hero-demo-script">
              Full demo script
            </Link>
          </Button>
          <button
            type="button"
            aria-label="Dismiss demo path"
            className="rounded-md p-1 text-muted hover:bg-muted/40 hover:text-foreground"
            onClick={dismiss}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <p className="mt-2 text-[10px] text-muted">
        After dismiss, reopen anytime from the <span className="font-medium">Demo</span> menu.
      </p>
    </section>
  );
}
