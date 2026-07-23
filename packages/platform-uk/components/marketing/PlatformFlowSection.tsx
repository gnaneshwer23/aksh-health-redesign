import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { container, sectionTight } from "@/components/marketing/marketing-ui";
import { PlatformFlowDiagram } from "@/components/marketing/PlatformFlowDiagram";

export default function PlatformFlowSection() {
  return (
    <section className={`${sectionTight} marketing-editorial-band`}>
      <div className={container}>
        <div className="mx-auto mb-8 max-w-2xl text-center md:mb-10">
          <p className="marketing-section-label mb-3">The journey</p>
          <h2 className="marketing-display-title mb-3 text-[clamp(1.85rem,3.4vw,2.75rem)] text-navy-dark">
            Capture → draft → approve
          </h2>
          <p className="text-base leading-relaxed text-slate/75 sm:text-lg">
            Supporting intelligence. Clinical intelligence supports every workflow while clinicians remain responsible
            for every approved outcome.
          </p>
        </div>

        <PlatformFlowDiagram variant="journey" />

        <div className="mt-8 flex flex-col items-center justify-center gap-3 text-center sm:flex-row sm:gap-6">
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2 text-sm font-medium text-navy-dark underline decoration-navy/25 underline-offset-[6px] transition-colors hover:decoration-emerald"
          >
            View workflow
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/demo/script"
            className="inline-flex items-center gap-2 text-sm font-medium text-navy-dark underline decoration-navy/25 underline-offset-[6px] transition-colors hover:decoration-emerald"
          >
            Book demonstration
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
