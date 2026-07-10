import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { createMetadata } from "@/lib/utils";

export const metadata: Metadata = createMetadata(
  "Hospital Winter Surge Case Study",
  "The Hospital Command Agent predicts a 22% increase in ED admissions. The Digital Twin recommends discharge acceleration 72 hours in advance."
);

export default function WinterSurgePage() {
  return (
    <section className="bg-background py-16">
      <div className="mx-auto max-w-3xl px-4">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">
          Case Study
        </p>
        <h1 className="mt-2 text-3xl font-bold">Hospital Winter Surge</h1>
        <p className="mt-4 text-muted">
          The Hospital Command Agent predicts a 22% increase in ED admissions
          based on historical patterns and current occupancy. The Hospital
          Digital Twin simulates discharge acceleration strategies 72 hours in
          advance, optimising bed capacity for the surge.
        </p>
        <p className="mt-4 text-sm text-muted">Full case study coming soon.</p>
        <Button className="mt-8" variant="outline" asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </section>
  );
}
