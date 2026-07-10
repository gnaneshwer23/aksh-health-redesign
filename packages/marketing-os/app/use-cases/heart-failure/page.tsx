import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { createMetadata } from "@/lib/utils";

export const metadata: Metadata = createMetadata(
  "Post-Discharge Heart Failure Case Study",
  "Mrs Johnson is discharged. Three days later, the Voice Care Agent detects readmission risk and escalates before she deteriorates."
);

export default function HeartFailurePage() {
  return (
    <section className="bg-background py-16">
      <div className="mx-auto max-w-3xl px-4">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">
          Case Study
        </p>
        <h1 className="mt-2 text-3xl font-bold">Post-Discharge Heart Failure</h1>
        <p className="mt-4 text-muted">
          Mrs Johnson is discharged after a heart failure admission. On Day 3,
          the Voice Care Agent calls, detects worsening breathlessness and ankle
          swelling, calculates HIGH readmission risk, and escalates to the nurse
          dashboard before deterioration.
        </p>
        <p className="mt-4 text-sm text-muted">Full case study coming soon.</p>
        <Button className="mt-8" variant="outline" asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </section>
  );
}
