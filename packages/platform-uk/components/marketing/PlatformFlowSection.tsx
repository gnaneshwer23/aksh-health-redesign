import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { MarketingSectionHeader } from "@/components/marketing/MarketingSectionHeader";
import { PlatformFlowDiagram } from "@/components/marketing/PlatformFlowDiagram";

export default function PlatformFlowSection() {
  return (
    <section className="bg-surface-muted py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <MarketingSectionHeader
          align="center"
          label="The journey"
          title="From EHR systems to governed record"
          description="One connected pipeline. Clinician approval on every output."
          className="mb-8 md:mb-10"
        />

        <div className="marketing-pastel-card rounded-3xl border border-white/60 bg-white p-6 shadow-sm md:p-10">
          <PlatformFlowDiagram variant="compact" />
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald transition-colors hover:text-emerald/80"
          >
            See full journey
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
