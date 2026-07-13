import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { container, sectionTight } from "@/components/marketing/marketing-ui";
import { PlatformFlowDiagram } from "@/components/marketing/PlatformFlowDiagram";

export default function PlatformFlowSection() {
  return (
    <section className={`${sectionTight} marketing-editorial-band`}>
      <div className={container}>
        <div className="mx-auto mb-10 max-w-2xl text-center md:mb-12">
          <p className="marketing-section-label mb-4">The journey</p>
          <h2 className="marketing-display-title mb-4 text-[clamp(1.85rem,3.4vw,2.75rem)] text-navy-dark">
            From EHR systems to governed record
          </h2>
          <p className="text-base leading-relaxed text-slate/75 sm:text-lg">
            One connected pipeline. Clinician approval on every output.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-navy/[0.08] bg-white/80 px-4 py-8 shadow-[0_24px_60px_-40px_rgba(0,26,61,0.35)] sm:px-8 md:px-10 md:py-10">
          <PlatformFlowDiagram variant="compact" />
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2 text-sm font-medium text-navy-dark underline decoration-navy/25 underline-offset-[6px] transition-colors hover:decoration-emerald"
          >
            See full journey
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
