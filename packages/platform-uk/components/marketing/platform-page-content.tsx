import Link from "next/link";

import TrustStrip from "@/components/marketing/TrustStrip";
import { ROLES } from "@/lib/onboarding/roles";

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

const platformLayers = [
  {
    title: "Intake",
    body: "Connect patient context from EMIS Web and SystmOne via FHIR R4 ready integration paths. Demo uses synthetic data.",
  },
  {
    title: "Review",
    body: "Specialist agents draft notes, safety checks, risk scores, and referrals. Everything lands in one review queue.",
  },
  {
    title: "Evidence",
    body: "Approved outputs stage as FHIR resources with an immutable SHIELD audit trail for governance and compliance.",
  },
  {
    title: "Integration",
    body: "Designed to sit above your existing EHR. No rip-and-replace. Production integration paths are on the roadmap.",
  },
];

const sectionNav = [
  { id: "layers", label: "Layers" },
  { id: "roles", label: "Roles" },
  { id: "hitl", label: "HITL" },
];

export function PlatformPageContent() {
  return (
    <>
      <section className="relative overflow-hidden bg-medicom-navy pb-12 pt-24 text-white">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:48px_48px] opacity-50" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-emerald">Platform</p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            One platform, eight roles, clinician-owned AI
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/75">
            Designed for EMIS Web and SystmOne workflows. Specialist agents draft notes, check safety, and coordinate
            care. Every output needs clinician approval before it reaches the record. Demo uses synthetic data.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-xl bg-emerald px-8 py-3.5 text-center text-base font-bold text-white shadow-card transition-all hover:-translate-y-0.5 hover:bg-emerald/90"
            >
              Get Started
            </Link>
            <Link
              href="/demo/patel"
              className="rounded-xl border-2 border-white/70 px-8 py-3.5 text-center text-base font-bold text-white transition-all hover:bg-white/10"
            >
              See it in action
            </Link>
          </div>

          <nav
            className="mt-10 flex flex-wrap gap-2"
            aria-label="Platform page sections"
          >
            {sectionNav.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-semibold text-white/85 transition-colors hover:bg-white/15"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
        <TrustStrip variant="hero" />
      </section>

      <section id="layers" className="scroll-mt-24 bg-white py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12 max-w-2xl">
            <h2 className="text-3xl font-bold text-navy">How the platform works</h2>
            <p className="mt-3 text-steel">
              Four layers from patient context to governed outputs. No tab switching. One connected workflow.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {platformLayers.map((layer, index) => (
              <article key={layer.title} className="rounded-2xl border border-border bg-surface p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 text-lg font-bold text-navy">{layer.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-steel">{layer.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="roles" className="scroll-mt-24 bg-surface py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12 max-w-2xl">
            <h2 className="text-3xl font-bold text-navy">Eight role dashboards</h2>
            <p className="mt-3 text-steel">
              Each role gets a purpose-built view. Clinical teams share one review queue. Demo uses synthetic data.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map((role) => (
              <Link
                key={role.id}
                href={AUDIENCE_LINKS[role.id] ?? "/signup"}
                className="group rounded-xl border border-border bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div
                  className="mb-3 inline-block rounded-md px-2.5 py-1 text-xs font-bold text-white"
                  style={{ backgroundColor: role.color }}
                >
                  {role.label}
                </div>
                <p className="text-sm leading-relaxed text-steel">{role.description}</p>
                <p className="mt-3 text-xs font-semibold text-navy group-hover:underline">Learn more</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="hitl" className="scroll-mt-24 bg-white py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="rounded-2xl border border-emerald/20 bg-emerald/5 p-8 text-center md:p-12">
            <h2 className="text-3xl font-bold text-navy">Human-in-the-loop. Always.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-steel">
              Every AI output is staged as a Draft. The clinician clicks Accept, Edit, or Reject. Nothing writes to the
              FHIR record without explicit human approval.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {["Accept", "Edit", "Reject"].map((action) => (
                <span
                  key={action}
                  className="rounded-xl border border-emerald/30 bg-white px-6 py-2.5 text-sm font-bold text-emerald shadow-sm"
                >
                  {action}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-emerald py-16 text-center text-white">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-3xl font-bold">Ready to explore the platform?</h2>
          <p className="mt-4 text-sm text-white/80">
            FHIR R4 ready design for EMIS Web and SystmOne. Clinical safety built in from day one. Demo uses synthetic
            data.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-xl bg-white px-8 py-3.5 text-base font-bold text-emerald transition-colors hover:bg-white/90"
            >
              Get Started
            </Link>
            <Link
              href="/demo/patel"
              className="rounded-xl border-2 border-white/80 px-8 py-3.5 text-base font-bold text-white transition-colors hover:bg-white/10"
            >
              See it in action
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
