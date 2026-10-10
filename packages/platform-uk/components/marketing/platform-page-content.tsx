import { MarketingPageHero } from "@/components/marketing/MarketingPageHero";
import TrustStrip from "@/components/marketing/TrustStrip";
import LvAgents from "@/components/marketing/lavender/LvAgents";
import LvClinicianGate from "@/components/marketing/lavender/LvClinicianGate";
import LvCtaBand from "@/components/marketing/lavender/LvCtaBand";
import LvDiabetesModule from "@/components/marketing/lavender/LvDiabetesModule";
import LvLayers from "@/components/marketing/lavender/LvLayers";
import LvLoop from "@/components/marketing/lavender/LvLoop";
import LvRoles from "@/components/marketing/lavender/LvRoles";
import LvTracks from "@/components/marketing/lavender/LvTracks";

const sectionNav = [
  { id: "loop", label: "Loop" },
  { id: "layers", label: "Layers" },
  { id: "agents", label: "Agents" },
  { id: "diabetes", label: "Diabetes" },
  { id: "roles", label: "Roles" },
  { id: "hitl", label: "Gates" },
  { id: "tracks", label: "Tracks" },
] as const;

export function PlatformPageContent() {
  return (
    <>
      <MarketingPageHero
        eyebrow="The Aksh Intelligence Platform"
        title="One intelligence layer. Eight roles. Clinician-owned decisions."
        lede="A single, auditable, human-in-the-loop layer beside your EHR. Agents draft, check and stage; a named clinician decides; every decision is audited. First module: Aksh Diabetes."
        primary={{ label: "Start free", href: "/signup" }}
        secondary={{ label: "Try without an account", href: "/dashboard/gp" }}
      >
        <nav className="mt-8 flex flex-wrap items-center gap-x-1 gap-y-2" aria-label="Platform page sections">
          {sectionNav.map((item, index) => (
            <span key={item.id} className="inline-flex items-center">
              {index > 0 ? (
                <span className="mx-2 text-[var(--mk-muted)]/40" aria-hidden>
                  /
                </span>
              ) : null}
              <a
                href={`#${item.id}`}
                className="text-sm font-medium text-[var(--mk-ink)]/80 underline-offset-4 transition-colors hover:text-[var(--mk-accent)] hover:underline"
              >
                {item.label}
              </a>
            </span>
          ))}
        </nav>
      </MarketingPageHero>

      <TrustStrip />

      <div id="loop" className="scroll-mt-24">
        <LvLoop />
      </div>
      <div id="layers" className="scroll-mt-24">
        <LvLayers />
      </div>
      <div id="agents" className="scroll-mt-24">
        <LvAgents />
      </div>
      <div id="diabetes" className="scroll-mt-24">
        <LvDiabetesModule />
      </div>
      <LvRoles variant="platform" />
      <div id="hitl" className="scroll-mt-24">
        <LvClinicianGate />
      </div>
      <div id="tracks" className="scroll-mt-24">
        <LvTracks />
      </div>

      <LvCtaBand
        title="Ready to explore the platform?"
        lede="Start in a sandbox clinic. Live patient data waits for your DPIA, clinical safety sign-off and partner approvals."
        primary={{ label: "Start free", href: "/signup" }}
        secondary={{ label: "Bring Aksh to your organisation", href: "/get-started" }}
      />
    </>
  );
}
