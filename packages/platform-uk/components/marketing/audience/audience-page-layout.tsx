import Link from "next/link";
import { Users } from "lucide-react";

import type { AudiencePageContent } from "@/components/marketing/audience/audience-content";
import { AudienceWorkflowSection } from "@/components/marketing/audience/AudienceWorkflowSection";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import TrustStrip from "@/components/marketing/TrustStrip";

export type AudiencePageLayoutProps = AudiencePageContent;

export function AudiencePageLayout({
  eyebrow,
  headline,
  subline,
  roles,
  pains,
  capabilities,
  endToEndWorkflow,
  workflowTitle,
  workflowDescription,
  agents,
  ctaPrimary,
  ctaSecondary,
  complianceNote,
}: AudiencePageLayoutProps) {
  return (
    <MarketingShell>
      {/* Hero */}
      <section className="relative overflow-hidden bg-medicom-navy text-white">
        <div
          className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:56px_56px] opacity-50"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgb(0_168_107/0.14),transparent_42%),radial-gradient(circle_at_85%_10%,rgb(0_61_122/0.28),transparent_38%)]"
          aria-hidden
        />
        <div
          className="marketing-hero-blob marketing-hero-blob--emerald absolute -left-24 top-20 h-64 w-64 opacity-20"
          aria-hidden
        />
        <div
          className="marketing-hero-blob marketing-hero-blob--navy absolute -right-16 bottom-12 h-48 w-48 opacity-15"
          aria-hidden
        />

        <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-20 lg:px-8 lg:py-24">
          <p className="marketing-section-label mb-4 text-accent">{eyebrow}</p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-5xl">{headline}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/80">{subline}</p>

          {roles && roles.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {roles.map((role) => (
                <span
                  key={role}
                  className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-sm"
                >
                  {role}
                </span>
              ))}
            </div>
          )}

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={ctaPrimary.href}
              className="rounded-xl bg-emerald px-8 py-3.5 text-center text-base font-bold text-white shadow-card-hover transition-all hover:-translate-y-0.5 hover:bg-emerald/90 sm:min-w-[11rem]"
            >
              {ctaPrimary.label}
            </Link>
            <Link
              href={ctaSecondary.href}
              className="rounded-xl border-2 border-white/80 px-8 py-3.5 text-center text-base font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-white/10 sm:min-w-[11rem]"
            >
              {ctaSecondary.label}
            </Link>
          </div>
        </div>
      </section>

      <TrustStrip />

      {/* Pain points */}
      <section className="bg-surface-muted py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12 max-w-2xl md:mb-14">
            <p className="marketing-section-label mb-3">The challenge</p>
            <h2 className="text-3xl font-bold tracking-tight text-navy md:text-4xl">Challenges we hear every day</h2>
            <p className="mt-3 text-lg text-steel">Built for NHS workflows with clinician approval on every output.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {pains.map((pain) => {
              const Icon = pain.icon;
              return (
                <article
                  key={pain.title}
                  className="marketing-capability-card rounded-2xl border border-border-subtle bg-white p-8 shadow-card"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-navy/10 text-navy">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="text-lg font-bold text-navy">{pain.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-steel">{pain.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="bg-white py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12 max-w-2xl md:mb-14">
            <p className="marketing-section-label mb-3">How we help</p>
            <h2 className="text-3xl font-bold tracking-tight text-navy md:text-4xl">How Aksh Health helps</h2>
            <p className="mt-3 text-lg text-steel">FHIR R4 ready outputs staged for review. Demo uses synthetic data.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="marketing-capability-card rounded-2xl border border-border-subtle bg-white p-6 shadow-card"
                >
                  <div
                    className={`mb-4 flex h-11 w-11 items-center justify-center rounded-full ${feature.iconBg}`}
                  >
                    <Icon className={`h-5 w-5 ${feature.iconColor}`} aria-hidden />
                  </div>
                  <h3 className="text-lg font-bold text-navy">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-steel">{feature.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {endToEndWorkflow && <AudienceWorkflowSection workflow={endToEndWorkflow} />}

      {/* Workflow / agents */}
      <section className="bg-surface py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12 max-w-2xl md:mb-14">
            <p className="marketing-section-label mb-3">Your workflow</p>
            <h2 className="text-3xl font-bold tracking-tight text-navy md:text-4xl">{workflowTitle}</h2>
            <p className="mt-3 text-lg text-steel">{workflowDescription}</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => {
              const Icon = agent.icon;
              return (
                <article
                  key={agent.name}
                  className="marketing-capability-card rounded-2xl border border-border-subtle bg-white p-6 shadow-card"
                >
                  <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-full ${agent.iconBg}`}>
                    <Icon className={`h-5 w-5 ${agent.iconColor}`} aria-hidden />
                  </div>
                  <div className={`mb-2 text-xs font-bold uppercase tracking-wide ${agent.iconColor}`}>
                    {agent.name}
                  </div>
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-steel">
                    <Users className="h-3 w-3" aria-hidden />
                    {agent.tag}
                  </div>
                  <p className="text-sm leading-relaxed text-slate">{agent.desc}</p>
                </article>
              );
            })}
          </div>

          <div className="mt-10 rounded-2xl border border-emerald/20 bg-emerald/5 p-8 text-center shadow-card">
            <p className="mb-2 text-lg font-bold text-emerald">Human-in-the-loop. Always.</p>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-steel">
              Every AI output is staged as a draft. The clinician clicks Accept, Edit, or Reject. Zero AI outputs are
              written to the FHIR record without explicit human approval.
            </p>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <TrustStrip />

      {/* CTA band */}
      <section className="bg-emerald py-16 text-center text-white md:py-20">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Ready to get started?</h2>
          {complianceNote && <p className="mt-4 text-sm leading-relaxed text-white/85">{complianceNote}</p>}
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={ctaPrimary.href}
              className="inline-block min-w-[11rem] rounded-xl bg-white px-8 py-3.5 text-base font-bold text-emerald shadow-card-hover transition-all hover:-translate-y-0.5 hover:bg-white/90"
            >
              {ctaPrimary.label}
            </Link>
            <Link
              href={ctaSecondary.href}
              className="inline-block min-w-[11rem] rounded-xl border-2 border-white/80 px-8 py-3.5 text-base font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-white/10"
            >
              {ctaSecondary.label}
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
