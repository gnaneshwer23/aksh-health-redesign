import Link from "next/link";
import {
  CheckCircle2,
  ClipboardCheck,
  Inbox,
  Link2,
  Pencil,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import AgentGrid from "@/components/marketing/AgentGrid";
import { MarketingCtaBand } from "@/components/marketing/MarketingCtaBand";
import { MarketingPageHero } from "@/components/marketing/MarketingPageHero";
import { container } from "@/components/marketing/marketing-ui";
import LvRoles from "@/components/marketing/lavender/LvRoles";
import TrustStrip from "@/components/marketing/TrustStrip";

const platformLayers = [
  {
    title: "Capture",
    body: "Structures consult context from notes or voice.",
    icon: Inbox,
  },
  {
    title: "Draft",
    body: "Documentation, safety, and risk stay draft until review.",
    icon: ClipboardCheck,
  },
  {
    title: "Approve",
    body: "Named reviewer approval on every output.",
    icon: ShieldCheck,
  },
  {
    title: "Stage",
    body: "Accepted drafts map to FHIR for exchange with existing systems.",
    icon: Link2,
  },
] as const;

const sectionNav = [
  { id: "layers", label: "How it works" },
  { id: "agents", label: "Capabilities" },
  { id: "roles", label: "Roles" },
  { id: "hitl", label: "Review" },
] as const;

const hitlActions = [
  {
    icon: CheckCircle2,
    label: "Accept",
    tone: "border-[var(--mk-line)] bg-white text-[var(--mk-ink)]",
    iconTone: "text-[var(--mk-accent)]",
    iconBg: "bg-pastel-mint",
  },
  {
    icon: Pencil,
    label: "Edit",
    tone: "border-[var(--mk-line)] bg-white text-[var(--mk-ink)]",
    iconTone: "text-[var(--mk-accent-strong)]",
    iconBg: "bg-[#eef1f4]",
  },
  {
    icon: XCircle,
    label: "Reject",
    tone: "border-[var(--mk-line)] bg-white text-[var(--mk-ink)]",
    iconTone: "text-danger",
    iconBg: "bg-pastel-coral",
  },
] as const;

export function PlatformPageContent() {
  return (
    <>
      <MarketingPageHero
        eyebrow="Platform"
        title="One platform, eight roles, clinician-owned care"
        lede="Capture → draft → approve. Sits beside your existing EHR. Every output needs clinician approval before exchange."
        primary={{ label: "Request access", href: "/get-started" }}
        secondary={{ label: "Open walkthrough", href: "/demo/patel" }}
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

      <section id="layers" className="scroll-mt-24 py-16 md:py-20">
        <div className={container}>
          <div className="mb-10 max-w-2xl">
            <p className="owkin-roles__eyebrow mb-3">Platform layers</p>
            <h2 className="font-[family-name:var(--font-marketing-display)] text-3xl font-semibold tracking-tight text-navy-dark md:text-4xl">
              Capture → draft → approve → exchange
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate/75">
              Four steps from intake to exchange, with supporting intelligence under clinician review.
            </p>
          </div>
          <ol className="aksh-layer-list">
            {platformLayers.map((layer, index) => {
              const Icon = layer.icon;
              return (
                <li key={layer.title} className="aksh-layer-list__item">
                  <span className="aksh-layer-list__step" aria-hidden>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="aksh-layer-list__icon" aria-hidden>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3>{layer.title}</h3>
                    <p>{layer.body}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <div id="agents" className="scroll-mt-24 border-t border-[var(--mk-line)]">
        <AgentGrid />
      </div>

      <div className="border-t border-[var(--mk-line)]">
        <LvRoles variant="platform" />
      </div>

      <section id="hitl" className="scroll-mt-24 border-t border-[var(--mk-line)] py-16 md:py-20">
        <div className={container}>
          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <p className="owkin-roles__eyebrow mb-4">Clinical safety</p>
              <h2 className="font-[family-name:var(--font-marketing-display)] text-2xl font-semibold tracking-tight text-navy-dark md:text-3xl">
                Clinician approval. Always.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate/75">
                Every clinical draft is staged for review. Nothing writes to the record without explicit human approval.
              </p>
              <p className="mt-4 text-sm text-slate/70">
                <Link href="/security" className="font-medium text-navy-dark underline-offset-4 hover:underline">
                  Security &amp; clinical safety
                </Link>
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {hitlActions.map((action) => {
                const Icon = action.icon;
                return (
                  <div
                    key={action.label}
                    className={`flex flex-col items-center rounded-[1.75rem] border px-4 py-6 text-center shadow-[var(--mk-shadow-frame)] ${action.tone}`}
                  >
                    <span
                      className={`mb-3 flex h-11 w-11 items-center justify-center rounded-full ${action.iconBg}`}
                      aria-hidden
                    >
                      <Icon className={`h-5 w-5 ${action.iconTone}`} />
                    </span>
                    <p className="text-sm font-semibold">{action.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <MarketingCtaBand
        title="Ready to explore the platform?"
        lede="Sits beside your existing EHR. Clinical safety gates from day one."
        primary={{ label: "Request access", href: "/get-started" }}
        secondary={{ label: "Open walkthrough", href: "/demo/patel" }}
      />
    </>
  );
}
