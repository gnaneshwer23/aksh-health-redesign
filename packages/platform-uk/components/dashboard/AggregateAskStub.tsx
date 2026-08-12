"use client";

import { MessageSquareOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Population / cohort Ask — metrics Q&A only (no named PHI).
 * Honest stub for ICS + researcher until aggregate Q&A ships; does not call /api/chat/patient.
 */
export function AggregateAskStub({
  role,
  className,
}: {
  role: "ics" | "researcher";
  className?: string;
}) {
  const title =
    role === "ics"
      ? "Ask Aksh · population metrics"
      : "Ask Aksh · cohort metrics";

  return (
    <section
      data-testid={`${role}-aggregate-ask-stub`}
      aria-label={title}
      className={cn(
        "rounded-xl border border-dashed border-border-subtle bg-surface-muted/30 px-4 py-3",
        className
      )}
    >
      <div className="flex flex-wrap items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/40 text-muted">
          <MessageSquareOff className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted" data-testid={`${role}-aggregate-ask-empty`}>
            Named patient chat is not available for this role (operations / research RBAC). A future
            aggregate Q&A will answer population or cohort metric questions only — no PHI, no chart
            spill. Until then this control stays disabled.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled
            data-testid={`${role}-aggregate-ask-disabled`}
          >
            Ask (not available yet)
          </Button>
        </div>
      </div>
    </section>
  );
}
