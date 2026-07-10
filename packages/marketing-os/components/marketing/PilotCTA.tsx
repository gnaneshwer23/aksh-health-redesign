import Link from "next/link";

import { Button } from "@/components/ui/button";

export function PilotCTA() {
  return (
    <section className="bg-primary py-16 text-white lg:py-20">
      <div className="mx-auto max-w-7xl px-4 text-center lg:px-8">
        <h2 className="text-3xl font-bold sm:text-4xl">
          Ready to Transform Your Healthcare System?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-slate-200">
          Join the NHS Phase 1 Pilot — October 2026. Three ICS sites. Dedicated
          implementation team. No upfront cost for pilot sites.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button variant="hero" size="lg" asChild>
            <Link href="/pilot/apply">Apply for Pilot Cohort</Link>
          </Button>
          <Button variant="heroOutline" size="lg" asChild>
            <Link href="/pilot">Learn About the Pilot</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
