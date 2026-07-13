import Link from "next/link";
import { CheckCircle2, ClipboardCheck, Inbox, Link2, Pencil, ShieldCheck, XCircle } from "lucide-react";

import AgentGrid from "@/components/marketing/AgentGrid";
import { MarketingCtaBand } from "@/components/marketing/MarketingCtaBand";
import { MarketingPageHero } from "@/components/marketing/MarketingPageHero";
import { MarketingSectionHeader } from "@/components/marketing/MarketingSectionHeader";
import { container } from "@/components/marketing/marketing-ui";
import { PastelCapabilityCard, pastelVariantAt } from "@/components/marketing/PastelCapabilityCard";
import RolesGridSection from "@/components/marketing/RolesGridSection";
import TrustStrip from "@/components/marketing/TrustStrip";

const platformLayers = [
  {
    title: "Intake",
    body: "Connect patient context from EMIS Web and SystmOne via FHIR R4 ready integration paths.",
    icon: Inbox,
  },
  {
    title: "Review",
    body: "Specialist agents draft notes, safety checks, risk scores, and referrals into one HITL queue.",
    icon: ClipboardCheck,
  },
  {
    title: "Evidence",
    body: "Approved outputs stage as FHIR resources with an immutable SHIELD audit trail.",
    icon: ShieldCheck,
  },
  {
    title: "Integration",
    body: "Designed to sit above your existing EHR. No rip-and-replace. Production paths remain gated by governance.",
    icon: Link2,
  },
] as const;

const sectionNav = [
  { id: "layers", label: "Layers" },
  { id: "agents", label: "Agents" },
  { id: "roles", label: "Roles" },
  { id: "hitl", label: "HITL" },
] as const;

const hitlActions = [
  { icon: CheckCircle2, label: "Accept", tone: "border-emerald/30 bg-emerald/10 text-emerald", iconTone: "text-emerald" },
  { icon: Pencil, label: "Edit", tone: "border-navy/15 bg-white text-navy", iconTone: "text-navy" },
  { icon: XCircle, label: "Reject", tone: "border-danger/20 bg-danger/5 text-danger", iconTone: "text-danger" },
] as const;

export function PlatformPageContent() {
  return (
    <>
      <MarketingPageHero
        eyebrow="Platform"
        title="One platform, eight roles, clinician-owned AI"
        lede="Designed for EMIS Web and SystmOne workflows. Eight specialist agents draft, check, and escalate — every output needs clinician approval before it reaches the record."
        primary={{ label: "Create account", href: "/signup" }}
        secondary={{ label: "Request organisation access", href: "/get-started" }}
      >
        <nav className="mt-10 flex flex-wrap gap-2" aria-label="Platform page sections">
          {sectionNav.map((item) => (
            <a key={item.id} href={`#${item.id}`} className="owkin-roles__dashboard">
              {item.label}
            </a>
          ))}
        </nav>
      </MarketingPageHero>

      <TrustStrip />

      <section id="layers" className="scroll-mt-24 py-16 md:py-20">
        <div className={container}>
          <MarketingSectionHeader
            align="left"
            label="Platform layers"
            title="How the platform works"
            description="Four layers from patient context to governed outputs. Deep dive on the journey page — this is the product map."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {platformLayers.map((layer, index) => (
              <PastelCapabilityCard
                key={layer.title}
                variant={pastelVariantAt(index)}
                icon={layer.icon}
                stepNumber={String(index + 1).padStart(2, "0")}
                title={layer.title}
                description={layer.body}
              />
            ))}
          </div>
          <p className="mt-8 text-sm text-slate/70">
            Prefer the end-to-end diagram?{" "}
            <Link href="/how-it-works#journey" className="font-medium text-navy-dark underline-offset-4 hover:underline">
              See how it works
            </Link>
            .
          </p>
        </div>
      </section>

      <div id="agents" className="scroll-mt-24 border-t border-navy/[0.06]">
        <AgentGrid />
      </div>

      <div className="border-t border-navy/[0.06]">
        <RolesGridSection variant="platform" />
      </div>

      <section id="hitl" className="scroll-mt-24 border-t border-navy/[0.06] py-16 md:py-20">
        <div className={container}>
          <div className="overflow-hidden rounded-2xl border border-navy/[0.08] bg-white/70">
            <div className="grid gap-0 lg:grid-cols-[1fr_1.4fr]">
              <div className="border-b border-navy/[0.06] p-8 md:p-10 lg:border-b-0 lg:border-r">
                <p className="owkin-roles__eyebrow mb-4">Clinical safety</p>
                <h2 className="font-[family-name:var(--font-marketing-display)] text-2xl font-semibold tracking-tight text-navy-dark md:text-3xl">
                  Human-in-the-loop. Always.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-slate/75">
                  Every AI output is staged as a Draft. The clinician clicks Accept, Edit, or Reject. Nothing writes to
                  the FHIR record without explicit human approval. MHRA-aware positioning: decision support, not
                  autonomous diagnosis. DCB0129 safety case in progress.
                </p>
                <p className="mt-4 text-sm text-slate/70">
                  <Link href="/security" className="font-medium text-navy-dark underline-offset-4 hover:underline">
                    Security &amp; compliance detail
                  </Link>
                  {" · "}
                  <Link href="/faq" className="font-medium text-navy-dark underline-offset-4 hover:underline">
                    FAQ
                  </Link>
                </p>
              </div>

              <div className="grid gap-4 p-6 sm:grid-cols-3 md:p-8">
                {hitlActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <div
                      key={action.label}
                      className={`flex flex-col items-center rounded-2xl border p-5 text-center ${action.tone}`}
                    >
                      <Icon className={`mb-3 h-6 w-6 ${action.iconTone}`} aria-hidden />
                      <p className="text-sm font-bold">{action.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <MarketingCtaBand
        title="Ready to explore the platform?"
        lede="FHIR R4 ready design for EMIS Web and SystmOne. Clinical safety built in from day one."
        primary={{ label: "Create account", href: "/signup" }}
        secondary={{ label: "Request organisation access", href: "/get-started" }}
      />
    </>
  );
}
