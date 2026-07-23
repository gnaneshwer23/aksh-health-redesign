import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { container, sectionTight } from "@/components/marketing/marketing-ui";
import { PlatformFlowDiagram } from "@/components/marketing/PlatformFlowDiagram";

const agentBeats = [
  { name: "CANVAS", role: "Capture intake" },
  { name: "SYNTHESIS", role: "SOAP draft" },
  { name: "GUARDIAN", role: "Safety flags" },
  { name: "HORIZON", role: "Risk (ex-ORACLE)" },
  { name: "PATHWAY", role: "Referrals" },
  { name: "CONDUCTOR", role: "HITL gate" },
  { name: "BRIDGE", role: "FHIR stage" },
  { name: "SHIELD", role: "Audit" },
] as const;

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
            Three calm steps. Twelve agents. Clinician approval on every output — liveEmis:false.
          </p>
        </div>

        <PlatformFlowDiagram variant="journey" />

        <div className="mx-auto mt-8 max-w-3xl">
          <p className="mb-3 text-center text-xs font-bold uppercase tracking-wider text-navy/55">
            Agents in the loop
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-2">
            {agentBeats.map((agent) => (
              <li
                key={agent.name}
                className="rounded-full border border-navy/[0.08] bg-white/80 px-3 py-1.5 text-xs text-slate/80"
              >
                <span className="font-semibold text-navy-dark">{agent.name}</span>
                <span className="text-slate/55"> · {agent.role}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-center text-xs leading-relaxed text-slate/60">
            VOICE and Dr.Assist are sub-capabilities under CANVAS / SYNTHESIS — not peer agents. PRISM and ATLAS stay
            Phase 2.
          </p>
        </div>

        <div className="mt-6 flex flex-col items-center justify-center gap-3 text-center sm:flex-row sm:gap-6">
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2 text-sm font-medium text-navy-dark underline decoration-navy/25 underline-offset-[6px] transition-colors hover:decoration-emerald"
          >
            See full journey
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/platform#agents"
            className="inline-flex items-center gap-2 text-sm font-medium text-navy-dark underline decoration-navy/25 underline-offset-[6px] transition-colors hover:decoration-emerald"
          >
            Twelve-agent roster
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/demo/script"
            className="inline-flex items-center gap-2 text-sm font-medium text-navy-dark underline decoration-navy/25 underline-offset-[6px] transition-colors hover:decoration-emerald"
          >
            Guided demo script
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
