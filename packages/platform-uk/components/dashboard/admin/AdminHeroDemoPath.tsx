"use client";

import Link from "next/link";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDismissibleDemo } from "@/lib/hooks/use-dismissible-demo";
import { cn } from "@/lib/utils";

/**
 * U6 — Practice-manager ops demo: integrations honesty → SHIELD audit → enquiries.
 * Frames BRIDGE / CONDUCTOR as staging + queue posture — not an eng console.
 * Quiet chrome: dismissible; reopen from TopBar Demo menu.
 */
const BEATS = [
  {
    n: "1",
    label: "Integrations honesty",
    href: "/dashboard/admin/integrations",
    hint: "BRIDGE staging · liveEmis:false",
  },
  {
    n: "2",
    label: "SHIELD audit",
    href: "/dashboard/admin/audit",
    hint: "Hash-chain · who approved what",
  },
  {
    n: "3",
    label: "Enquiries",
    href: "/dashboard/admin/organisation-enquiries",
    hint: "Access requests · org inbox",
  },
] as const;

const STORAGE_KEY = "aksh-admin-hero-demo-dismissed";

export function AdminHeroDemoPath({ className }: { className?: string }) {
  const { dismissed, dismiss } = useDismissibleDemo(STORAGE_KEY);

  if (dismissed) return null;

  return (
    <section
      aria-label="Practice admin hero demo path"
      data-testid="admin-hero-demo-path"
      className={cn(
        "rounded-xl border border-primary/25 bg-primary/[0.04] px-4 py-3 text-sm shadow-sm",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
              Ops demo · practice manager
            </p>
            <Badge variant="outline" className="text-[10px]">
              liveEmis:false
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              staging / sim
            </Badge>
          </div>
          <p className="text-xs text-muted">
            Integrations honesty → SHIELD audit → organisation enquiries. CONDUCTOR shows queue
            health; BRIDGE stages FHIR after clinician Accept — designed for EMIS / SystmOne
            pathways, not live record write-back. Precision Health / partner readiness stay
            scaffolding links.
          </p>
          <ol className="flex flex-wrap items-stretch gap-2" aria-label="Demo beats">
            {BEATS.map((beat, i) => (
              <li key={beat.n} className="flex items-center gap-2">
                <Link
                  href={beat.href}
                  className="inline-flex min-w-[9.5rem] flex-col rounded-lg border border-border-subtle bg-card px-3 py-2 transition hover:border-primary/40 hover:bg-primary/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  data-testid={`admin-hero-beat-${beat.n}`}
                  onClick={dismiss}
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
        <div className="flex shrink-0 items-start gap-1">
          <Button size="sm" variant="outline" asChild>
            <Link href="/demo/script" data-testid="admin-hero-demo-script">
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
