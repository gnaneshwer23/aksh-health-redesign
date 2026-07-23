"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import { resolveFirstRunCopy } from "@/lib/product-journey";
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
  const { profile } = useUserProfile();
  const [dismissed, setDismissed] = useState(true);

  const copy = resolveFirstRunCopy(role, {
    userRole: profile?.role ?? data?.user?.role ?? null,
    preferences: profile?.preferences ?? null,
  });

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
        <div className="min-w-0 space-y-2">
          <p className="font-semibold text-foreground">{copy.title}</p>
          <p className="text-xs leading-relaxed text-muted sm:text-sm">{copy.body}</p>

          {copy.youApprove ? (
            <p className="text-xs text-foreground">
              <span className="font-medium">You approve: </span>
              {copy.youApprove}
            </p>
          ) : null}

          {copy.agents && copy.agents.length > 0 ? (
            <div className="flex flex-wrap gap-1" aria-label="Agents for your role">
              {copy.agents.slice(0, 8).map((name) => (
                <Badge key={name} variant="outline" className="text-[10px]">
                  {name}
                </Badge>
              ))}
            </div>
          ) : null}

          {copy.honesty ? (
            <p className="text-[11px] text-muted" data-testid="first-run-honesty">
              {copy.honesty.includes("liveEmis") ? copy.honesty : `${copy.honesty} · liveEmis:false`}
            </p>
          ) : (
            <p className="text-[11px] text-muted" data-testid="first-run-honesty">
              liveEmis:false
            </p>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
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
