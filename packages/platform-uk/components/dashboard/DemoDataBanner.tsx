"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

/** Clear public-demo honesty banner for allowlisted dashboard surfaces. */
export function DemoDataBanner({
  className,
  surface = "ICS"
}: {
  className?: string;
  surface?: string;
}) {
  return (
    <div
      role="status"
      data-testid="demo-data-banner"
      className={cn(
        "rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950",
        className
      )}
    >
      <p className="font-medium">
        Public {surface} demo — synthetic data only
      </p>
      <p className="mt-1 text-amber-900/90">
        This view is open without sign-in for product walkthroughs. Figures are rehearsal / synthetic
        population signals, not a live ICS feed. No EHR write-back.{" "}
        <Link href="/walkthrough" className="underline underline-offset-2 hover:text-amber-950">
          See walkthrough
        </Link>
        {" · "}
        <Link href="/signup" className="underline underline-offset-2 hover:text-amber-950">
          Create an account
        </Link>{" "}
        for role-gated workspaces, or{" "}
        <Link href="/get-started" className="underline underline-offset-2 hover:text-amber-950">
          discuss a pilot
        </Link>
        .
      </p>
    </div>
  );
}
