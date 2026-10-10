"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

/** Clear public-demo honesty banner for allowlisted dashboard surfaces. */
export function DemoDataBanner({
  className,
  surface = "Population"
}: {
  className?: string;
  surface?: string;
}) {
  return (
    <div
      role="status"
      data-testid="demo-data-banner"
      className={cn(
        "rounded-2xl border border-amber-200/80 bg-pastel-amber px-4 py-2.5 text-xs text-pastel-amber-ink",
        className
      )}
    >
      <p className="font-medium">
        Public {surface} demo — synthetic data only
      </p>
      <p className="mt-1 text-amber-900/90">
        This view is open without sign-in for product walkthroughs. Figures are rehearsal / synthetic
        signals, not a live EHR or clinical feed. No EHR write-back · liveEmis:false.{" "}
        <Link href="/demo/script" className="underline underline-offset-2 hover:text-amber-950">
          Demo script
        </Link>
        {" · "}
        <Link href="/demo/patel" className="underline underline-offset-2 hover:text-amber-950">
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
