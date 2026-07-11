import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FlaskConical,
  HeartPulse,
  Inbox,
  Link2,
  Network,
  Pencil,
  Pill,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
  User,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import AgentGrid from "@/components/marketing/AgentGrid";
import { MarketingSectionHeader } from "@/components/marketing/MarketingSectionHeader";
import { PastelCapabilityCard, pastelVariantAt } from "@/components/marketing/PastelCapabilityCard";
import TrustStrip from "@/components/marketing/TrustStrip";
import { ROLES, type UserRole } from "@/lib/onboarding/roles";

const AUDIENCE_LINKS: Record<string, string> = {
  gp: "/for-clinicians",
  nurse: "/for-clinicians",
  "clinical-pharmacist": "/for-clinicians",
  "practice-manager": "/for-practices",
  "ics-lead": "/for-ics",
  "hospital-executive": "/for-hospitals",
  patient: "/for-patients",
  researcher: "/for-research",
};

const ROLE_ICONS: Record<UserRole, LucideIcon> = {
  gp: Stethoscope,
  nurse: HeartPulse,
  "clinical-pharmacist": Pill,
  "practice-manager": Building2,
  "ics-lead": Network,
  "hospital-executive": TrendingUp,
  patient: User,
  researcher: FlaskConical,
};

const platformLayers = [
  {
    title: "Intake",
    body: "Connect patient context from EMIS Web and SystmOne via FHIR R4 ready integration paths. Demo uses synthetic data.",
    icon: Inbox,
  },
  {
    title: "Review",
    body: "Specialist agents draft notes, safety checks, risk scores, and referrals. Everything lands in one review queue.",
    icon: ClipboardCheck,
  },
  {
    title: "Evidence",
    body: "Approved outputs stage as FHIR resources with an immutable SHIELD audit trail for governance and compliance.",
    icon: ShieldCheck,
  },
  {
    title: "Integration",
    body: "Designed to sit above your existing EHR. No rip-and-replace. Production integration paths are on the roadmap.",
    icon: Link2,
  },
] as const;

const sectionNav = [
  { id: "layers", label: "Layers" },
  { id: "roles", label: "Roles" },
  { id: "hitl", label: "HITL" },
] as const;

const hitlActions = [
  {
    icon: CheckCircle2,
    label: "Accept",
    tone: "border-emerald/30 bg-emerald/10 text-emerald",
    iconTone: "text-emerald",
  },
  {
    icon: Pencil,
    label: "Edit",
    tone: "border-navy/15 bg-white text-navy",
    iconTone: "text-navy",
  },
  {
    icon: XCircle,
    label: "Reject",
    tone: "border-danger/20 bg-danger/5 text-danger",
    iconTone: "text-danger",
  },
] as const;

export function PlatformPageContent() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-navy-light via-white to-white">
        <div
          className="marketing-hero-blob marketing-hero-blob--emerald absolute -right-24 top-0 h-[24rem] w-[24rem] opacity-[0.12]"
          aria-hidden
        />
        <div
          className="marketing-hero-blob marketing-hero-blob--navy absolute -left-28 top-16 h-[22rem] w-[22rem] opacity-[0.08]"
          aria-hidden
        />

        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-24 lg:px-8 lg:py-28">
          <p className="marketing-section-label mb-4">Platform</p>
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-navy md:text-5xl">
            One platform, eight roles, clinician-owned AI
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-steel">
            Designed for EMIS Web and SystmOne workflows. Specialist agents draft notes, check safety, and coordinate
            care. Every output needs clinician approval before it reaches the record. Demo uses synthetic data.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/signup"
              className="rounded-xl bg-emerald px-8 py-3.5 text-center text-base font-semibold text-white shadow-lg shadow-emerald/20 transition-all hover:-translate-y-0.5 hover:bg-emerald/90 sm:min-w-[11rem]"
            >
              Create account
            </Link>
            <Link
              href="/get-started"
              className="rounded-xl border border-navy/25 bg-white px-8 py-3.5 text-center text-base font-medium text-navy shadow-sm transition-all hover:-translate-y-0.5 hover:border-navy/40 hover:bg-navy/[0.03] sm:min-w-[11rem]"
            >
              Request organisation access
            </Link>
          </div>

          <nav className="mt-10 flex flex-wrap gap-2" aria-label="Platform page sections">
            {sectionNav.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="rounded-full border border-border-subtle bg-white px-4 py-1.5 text-sm font-semibold text-navy shadow-sm transition-colors hover:border-emerald/30 hover:bg-emerald/[0.04]"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <div className="border-t border-border-subtle bg-white">
        <TrustStrip />
      </div>

      <section id="layers" className="scroll-mt-24 bg-surface-muted py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <MarketingSectionHeader
            align="left"
            label="Platform layers"
            title="How the platform works"
            description="Four layers from patient context to governed outputs. No tab switching. One connected workflow."
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
        </div>
      </section>

      <AgentGrid />

      <section id="roles" className="scroll-mt-24 bg-white py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <MarketingSectionHeader
            align="left"
            label="Role dashboards"
            title="Eight role dashboards"
            description="Each role gets a purpose-built view. Clinical teams share one review queue. Demo uses synthetic data."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map((role, index) => (
              <PastelCapabilityCard
                key={role.id}
                variant={pastelVariantAt(index)}
                icon={ROLE_ICONS[role.id]}
                title={role.label}
                description={role.description}
                href={AUDIENCE_LINKS[role.id] ?? "/signup"}
                compact
                footer={
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-emerald">
                    Learn more
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                }
              />
            ))}
          </div>
        </div>
      </section>

      <section id="hitl" className="scroll-mt-24 bg-white py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl border-2 border-emerald/25 bg-gradient-to-br from-emerald/5 via-white to-emerald/[0.03]">
            <div className="grid gap-0 lg:grid-cols-[1fr_1.4fr]">
              <div className="border-b border-emerald/15 p-8 md:p-10 lg:border-b-0 lg:border-r">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald/10">
                  <ClipboardCheck className="h-7 w-7 text-emerald" aria-hidden />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">Human-in-the-loop. Always.</h2>
                <p className="mt-4 text-base leading-relaxed text-steel">
                  Every AI output is staged as a Draft. The clinician clicks Accept, Edit, or Reject. Nothing writes to
                  the FHIR record without explicit human approval.
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

      <section className="bg-emerald py-16 text-center text-white md:py-20">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Ready to explore the platform?</h2>
          <p className="mt-4 text-lg leading-relaxed text-white/80">
            FHIR R4 ready design for EMIS Web and SystmOne. Clinical safety built in from day one. Demo uses synthetic
            data.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-block min-w-[11rem] rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-emerald shadow-lg transition-all hover:-translate-y-0.5 hover:bg-white/90"
            >
              Create account
            </Link>
            <Link
              href="/get-started"
              className="inline-block min-w-[11rem] rounded-xl border border-white/40 px-8 py-3.5 text-base font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-white/10"
            >
              Request organisation access
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
