import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { createMetadata } from "@/lib/utils";

export const metadata: Metadata = createMetadata(
  "Type 2 Diabetes + DVT Case Study",
  "See how all seven Aksh Health AI agents work together when a patient presents with worsening glycaemic control and suspected DVT."
);

export default function T2dDvtPage() {
  return (
    <section className="bg-background py-16">
      <div className="mx-auto max-w-3xl px-4">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">
          Case Study
        </p>
        <h1 className="mt-2 text-3xl font-bold">Type 2 Diabetes + DVT</h1>
        <p className="mt-4 text-muted">
          A patient presents with worsening glycaemic control and suspected DVT.
          See how all seven agents work together in a single consultation — from
          ORACLE risk scoring to GUARDIAN safety checks, SYNTHESIS documentation,
          and Referral Agent urgency prediction.
        </p>
        <p className="mt-4 text-sm text-muted">
          Full case study coming soon. This page is a stub for the golden
          scenario journey (Mr James Patel).
        </p>
        <Button className="mt-8" variant="outline" asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </section>
  );
}
