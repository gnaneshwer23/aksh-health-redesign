"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

/** Compact help links shared across role dashboards — matches marketing IA language. */
export function ProductHelpLinks({ className }: { className?: string }) {
  return (
    <p
      data-testid="product-help-links"
      className={cn("text-xs text-muted", className)}
    >
      <Link href="/walkthrough" className="text-primary underline-offset-2 hover:underline">
        See walkthrough
      </Link>
      <span aria-hidden className="mx-1.5 text-border">
        ·
      </span>
      <Link href="/how-it-works" className="text-primary underline-offset-2 hover:underline">
        How it works
      </Link>
      <span aria-hidden className="mx-1.5 text-border">
        ·
      </span>
      <Link href="/resources" className="text-primary underline-offset-2 hover:underline">
        Resources &amp; roadmap
      </Link>
    </p>
  );
}
