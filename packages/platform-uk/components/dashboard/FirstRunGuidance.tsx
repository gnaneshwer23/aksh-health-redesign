"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FIRST_RUN_BY_DASHBOARD } from "@/lib/product-journey";
import type { DashboardRole } from "@/lib/zustand/dashboardStore";
import { cn } from "@/lib/utils";

const STORAGE_PREFIX = "aksh-first-run-dismissed:";

export function FirstRunGuidance({
  role,
  className,
}: {
  role: DashboardRole;
  className?: string;
}) {
  const { status, data } = useSession();
  const [dismissed, setDismissed] = useState(true);
  const copy = FIRST_RUN_BY_DASHBOARD[role];

  useEffect(() => {
    if (status !== "authenticated" || !data?.user?.onboardingComplete) {
      setDismissed(true);
      return;
    }
    try {
      setDismissed(localStorage.getItem(`${STORAGE_PREFIX}${role}`) === "1");
    } catch {
      setDismissed(false);
    }
  }, [status, data?.user?.onboardingComplete, role]);

  if (dismissed || status !== "authenticated" || !data?.user?.onboardingComplete) {
    return null;
  }

  function dismiss() {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${role}`, "1");
    } catch {
      /* ignore quota */
    }
    setDismissed(true);
  }

  return (
    <div
      role="region"
      aria-label="First-run guidance"
      data-testid="first-run-guidance"
      className={cn(
        "rounded-xl border border-primary/20 bg-primary/[0.04] px-4 py-3 text-sm text-foreground shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="font-semibold text-foreground">{copy.title}</p>
          <p className="text-xs leading-relaxed text-muted sm:text-sm">{copy.body}</p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button size="sm" asChild>
              <Link href={copy.primaryHref}>{copy.primaryLabel}</Link>
            </Button>
            {copy.secondaryHref && copy.secondaryLabel ? (
              <Button size="sm" variant="outline" asChild>
                <Link href={copy.secondaryHref}>{copy.secondaryLabel}</Link>
              </Button>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          aria-label="Dismiss first-run guidance"
          className="shrink-0 rounded-md p-1 text-muted hover:bg-primary/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onClick={dismiss}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
