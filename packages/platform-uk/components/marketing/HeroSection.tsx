import Link from "next/link";
import { CheckCircle2, Shield, Sparkles } from "lucide-react";

import TrustStrip from "@/components/marketing/TrustStrip";

const queueItems = [
  { agent: "SYNTHESIS", label: "SOAP note draft", tone: "bg-navy" },
  { agent: "GUARDIAN", label: "Drug interaction check", tone: "bg-danger" },
  { agent: "ORACLE", label: "CVD risk score", tone: "bg-warning" },
] as const;

function HeroDashboardMock() {
  return (
    <div className="marketing-hero-card relative mx-auto w-full max-w-md lg:max-w-none">
      <div className="overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-xl shadow-navy/10">
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-steel/70">GP Review Queue</p>
            <p className="mt-0.5 text-sm font-semibold text-navy">Clinician dashboard</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald/20 bg-emerald/[0.08] px-2.5 py-1 text-[11px] font-medium text-emerald">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald" aria-hidden />
            Live demo
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 p-5">
          <div className="rounded-xl border border-border-subtle bg-surface p-4">
            <p className="text-2xl font-semibold text-navy">3</p>
            <p className="mt-1 text-xs text-steel">Pending reviews</p>
          </div>
          <div className="rounded-xl border border-border-subtle bg-surface p-4">
            <p className="text-2xl font-semibold text-emerald">12</p>
            <p className="mt-1 text-xs text-steel">Active agents</p>
          </div>
        </div>

        <div className="space-y-2 px-5 pb-5">
          {queueItems.map((item) => (
            <div
              key={item.agent}
              className="flex items-center justify-between rounded-xl border border-border-subtle bg-white px-4 py-3 transition-colors hover:bg-surface"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white ${item.tone}`}
                >
                  {item.agent}
                </span>
                <span className="truncate text-sm text-slate">{item.label}</span>
              </div>
              <CheckCircle2 className="h-4 w-4 shrink-0 text-steel/40" aria-hidden />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 border-t border-border-subtle bg-surface px-5 py-3">
          <Shield className="h-3.5 w-3.5 shrink-0 text-emerald" aria-hidden />
          <p className="text-xs text-steel">Every output needs clinician approval before the record</p>
        </div>
      </div>

      <div
        className="marketing-hero-blob marketing-hero-blob--emerald absolute -right-8 -top-8 -z-10 h-40 w-40 opacity-40"
        aria-hidden
      />
      <div
        className="marketing-hero-blob marketing-hero-blob--navy absolute -bottom-10 -left-10 -z-10 h-48 w-48 opacity-20"
        aria-hidden
      />
    </div>
  );
}

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-navy-light via-white to-white">
      <div
        className="marketing-hero-blob marketing-hero-blob--emerald absolute -right-24 top-0 h-[26rem] w-[26rem] opacity-[0.12]"
        aria-hidden
      />
      <div
        className="marketing-hero-blob marketing-hero-blob--navy absolute -left-32 top-24 h-[24rem] w-[24rem] opacity-[0.08]"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-7xl px-6 pb-16 pt-16 lg:pb-20 lg:pt-20">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="text-center lg:text-left">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-border-subtle bg-white px-4 py-1.5 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-emerald" aria-hidden />
              <span className="text-sm font-medium text-steel">AI-native Healthcare OS for the NHS</span>
            </div>

            <h1 className="mb-6 max-w-2xl text-[2.75rem] font-bold leading-[1.05] tracking-tight text-navy sm:text-6xl md:text-[4.25rem] lg:mx-0 lg:max-w-none">
              Clinical workflows,
              <span className="block text-emerald">one platform.</span>
            </h1>

            <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-steel md:text-xl lg:mx-0">
              Designed for EMIS Web and SystmOne with FHIR R4 ready integration paths. Specialist AI agents draft
              notes, check safety, and coordinate care. Every output needs clinician approval before it reaches the
              record.
            </p>

            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center lg:justify-start">
              <Link
                href="/signup"
                className="rounded-xl bg-emerald px-8 py-3.5 text-center text-base font-semibold text-white shadow-lg shadow-emerald/20 transition-all hover:-translate-y-0.5 hover:bg-emerald/90 sm:min-w-[11rem]"
              >
                Get Started
              </Link>
              <Link
                href="/demo/patel"
                className="rounded-xl border border-navy/25 bg-white px-8 py-3.5 text-center text-base font-medium text-navy shadow-sm transition-all hover:-translate-y-0.5 hover:border-navy/40 hover:bg-navy/[0.03] sm:min-w-[11rem]"
              >
                See it in action
              </Link>
            </div>
          </div>

          <div className="hidden sm:block">
            <HeroDashboardMock />
          </div>
        </div>
      </div>

      <div className="relative z-10 border-t border-border-subtle bg-white">
        <TrustStrip />
      </div>
    </section>
  );
}
