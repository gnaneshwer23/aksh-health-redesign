"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * U5 — One-click pharmacist med-safety demo: review → GUARDIAN interactions → HITL stage.
 * Honest: Accept/Edit/Reject · SHIELD on decisions · pharmacist-review spine · liveEmis:false.
 * Quiet chrome: dismissible; reopen from TopBar Demo menu. Nightingale seafoam (no purple).
 */
const BEATS = [
  {
    n: "1",
    label: "Med review",
    href: "/dashboard/pharmacist/reviews",
    hint: "Polypharmacy queue · Mark Reviewed",
  },
  {
    n: "2",
    label: "GUARDIAN check",
    href: "/dashboard/pharmacist/interactions",
    hint: "Interaction / allergy drafts",
  },
  {
    n: "3",
    label: "HITL stage",
    href: "/dashboard/pharmacist/interactions#pharmacist-hitl-stage",
    hint: "Accept · SHIELD · liveEmis:false",
  },
] as const;

const STORAGE_KEY = "aksh-pharmacist-hero-demo-dismissed";

export function PharmacistHeroDemoPath({ className }: { className?: string }) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

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
      aria-label="Pharmacist hero demo path"
      data-testid="pharmacist-hero-demo-path"
      className={cn(
        "rounded-xl border border-accent/25 bg-accent/[0.04] px-4 py-3 text-sm shadow-sm",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
              Med-safety demo · pharmacist
            </p>
            <Badge variant="outline" className="text-[10px]">
              liveEmis:false
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              synthetic
            </Badge>
          </div>
          <p className="text-xs text-muted">
            Med review → GUARDIAN interaction check → your Accept / Edit / Reject. Mark Reviewed and
            Accept append SHIELD — no EHR write-back.
          </p>
          <ol className="flex flex-wrap items-stretch gap-2" aria-label="Demo beats">
            {BEATS.map((beat, i) => (
              <li key={beat.n} className="flex items-center gap-2">
                <Link
                  href={beat.href}
                  className="inline-flex min-w-[9.5rem] flex-col rounded-lg border border-border-subtle bg-card px-3 py-2 transition hover:border-accent/40 hover:bg-accent/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  data-testid={`pharmacist-hero-beat-${beat.n}`}
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
            <Link href="/demo/script" data-testid="pharmacist-hero-demo-script">
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
        After dismiss, reopen from the <span className="font-medium">Demo</span> menu.
      </p>
    </section>
  );
}
