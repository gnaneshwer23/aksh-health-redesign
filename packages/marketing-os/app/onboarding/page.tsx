import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { createMetadata } from "@/lib/utils";

export const metadata: Metadata = createMetadata(
  "Onboarding",
  "Aksh Health onboarding — configure your role and get started."
);

export default function OnboardingPage({
  searchParams,
}: {
  searchParams: { role?: string };
}) {
  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-lg px-4 text-center">
        <h1 className="text-2xl font-bold">Onboarding</h1>
        <p className="mt-3 text-muted">
          Welcome{searchParams.role ? `, ${searchParams.role}` : ""}. Platform
          onboarding is coming soon for pilot cohort members.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/pilot/apply">Apply for Pilot</Link>
        </Button>
      </div>
    </section>
  );
}
