"use client";

import { ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Persistent, non-dismissible notice shown on every role dashboard. Reviewers and
 * NHS stakeholders should never be in doubt that dashboard data is synthetic.
 */
export function DemoDataBanner({ className }: { className?: string }) {
  return (
    <div
      role="status"
      data-testid="demo-data-banner"
      className={cn(
        "flex shrink-0 items-center justify-center gap-2 border-b border-emerald/20 bg-emerald/10 px-4 py-2 text-center text-xs font-medium text-navy sm:text-sm",
        className
      )}
    >
      <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald" aria-hidden />
      <p>
        <span className="font-semibold">Demo environment</span>
        <span className="px-1.5 text-navy/40" aria-hidden>
          ·
        </span>
        All patients are synthetic
        <span className="px-1.5 text-navy/40" aria-hidden>
          ·
        </span>
        No real NHS data
      </p>
    </div>
  );
}
