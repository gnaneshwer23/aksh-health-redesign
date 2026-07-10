import Link from "next/link";

import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-navy-dark text-white">
      <div className="absolute inset-0 grid-pattern" />
      <div className="relative mx-auto max-w-7xl px-4 py-20 lg:px-8 lg:py-28">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Healthcare Has Data.
            <br />
            <span className="text-accent">Now It Has Intelligence.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-slate-300">
            Aksh Health is the AI operating system connecting your existing
            healthcare infrastructure — EMIS, SystmOne, Epic — to a network of
            specialist AI agents that coordinate care, predict deterioration, and
            eliminate administrative waste.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button variant="hero" size="lg" asChild>
              <Link href="/pilot">Request a Pilot</Link>
            </Button>
            <Button variant="heroOutline" size="lg" asChild>
              <Link href="#how-it-works">See How It Works</Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            {[
              "NHS DCB0129 Compliant",
              "FHIR R4 Native",
              "Human-in-the-Loop",
            ].map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-sm text-slate-200"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
