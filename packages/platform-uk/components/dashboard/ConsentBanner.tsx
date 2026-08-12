"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

import { cn } from "@/lib/utils";

/**
 * Discrete consent gate only — shown when an authenticated user still needs
 * onboarding consent. HITL honesty lives in HonestyStatusBar, not here.
 */
export function ConsentBanner({ className }: { className?: string }) {
  const { status, data } = useSession();

  if (status !== "authenticated") return null;
  if (data?.user?.onboardingComplete) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-secondary",
        className
      )}
      role="alert"
      aria-label="Consent required"
      data-testid="consent-gate-banner"
    >
      <p>
        Consent is still required before clinical drafting. Complete the consent step to continue
        diabetes / care-coordination workflows.
      </p>
      <Link
        href="/onboarding/consent"
        className="shrink-0 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-white hover:bg-accent/90"
      >
        Complete consent
      </Link>
    </div>
  );
}
