import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { createMetadata } from "@/lib/utils";

export const metadata: Metadata = createMetadata(
  "ICS Equity Review Case Study",
  "The EQUITY agent detects disparity in T2D outcomes across IMD quintiles across 47 practices. Population intervention is triggered."
);

export default function EquityPage() {
  return (
    <section className="bg-background py-16">
      <div className="mx-auto max-w-3xl px-4">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">
          Case Study
        </p>
        <h1 className="mt-2 text-3xl font-bold">ICS Equity Review</h1>
        <p className="mt-4 text-muted">
          The EQUITY agent detects a disparity in Type 2 Diabetes outcomes
          across IMD quintiles across 47 practices within the Integrated Care
          System. A population-level intervention is triggered, coordinating
          care pathway automation across affected practices.
        </p>
        <p className="mt-4 text-sm text-muted">Full case study coming soon.</p>
        <Button className="mt-8" variant="outline" asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </section>
  );
}
