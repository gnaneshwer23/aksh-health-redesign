"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

/** Compact help links shared across role dashboards. */
export function ProductHelpLinks({ className }: { className?: string }) {
  return (
    <p
      data-testid="product-help-links"
      className={cn("text-xs text-muted", className)}
    >
      <Link href="/demo/patel" className="text-primary underline-offset-2 hover:underline">
        See walkthrough
      </Link>
      <span aria-hidden className="mx-1.5 text-border">
        ·
      </span>
      <Link href="/platform" className="text-primary underline-offset-2 hover:underline">
        Platform
      </Link>
      <span aria-hidden className="mx-1.5 text-border">
        ·
      </span>
      <Link href="/security" className="text-primary underline-offset-2 hover:underline">
        Security
      </Link>
    </p>
  );
}
