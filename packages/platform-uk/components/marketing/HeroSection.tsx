import Link from "next/link";
import { Activity, CheckCircle2, Shield } from "lucide-react";

import TrustStrip from "@/components/marketing/TrustStrip";

const trustPoints = [
  "NHS DCB0129 pathway",
  "FHIR R4 ready",
  "Human-in-the-Loop",
  "NHS CIS2 ready",
  "DTAC aligned",
] as const;

const queueItems = [
  { agent: "SYNTHESIS", label: "SOAP note draft", tone: "bg-navy" },
  { agent: "GUARDIAN", label: "Drug interaction check", tone: "bg-danger" },
  { agent: "ORACLE", label: "CVD risk score", tone: "bg-warning" },
] as const;

function HeroDashboardMock() {
  return (
    <div className="marketing-hero-card relative mx-auto w-full max-w-md lg:max-w-none">
      <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/10 shadow-card-hover backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/50">GP Review Queue</p>
            <p className="text-sm font-bold text-white">Clinician dashboard</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" aria-hidden />
            Live demo
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 p-5">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-2xl font-bold text-white">3</p>
            <p className="mt-1 text-xs font-medium text-white/60">Pending reviews</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-2xl font-bold text-accent">12</p>
            <p className="mt-1 text-xs font-medium text-white/60">Active agents</p>
          </div>
        </div>

        <div className="space-y-2.5 px-5 pb-5">
          {queueItems.map((item) => (
            <div
              key={item.agent}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition-colors hover:bg-white/10"
            >
              <div className="flex items-center gap-3">
                <span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white ${item.tone}`}>
                  {item.agent}
                </span>
                <span className="text-sm text-white/85">{item.label}</span>
              </div>
              <CheckCircle2 className="h-4 w-4 shrink-0 text-white/30" aria-hidden />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 border-t border-white/10 bg-white/5 px-5 py-3">
          <Shield className="h-4 w-4 text-accent" aria-hidden />
          <p className="text-xs text-white/70">Every output needs clinician approval before the record</p>
        </div>
      </div>

      <div
        className="marketing-hero-blob marketing-hero-blob--emerald pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 opacity-40"
        aria-hidden
      />
      <div
        className="marketing-hero-blob marketing-hero-blob--navy pointer-events-none absolute -right-6 -top-6 h-24 w-24 opacity-30"
        aria-hidden
      />
    </div>
  );
}

export default function HeroSection() {
  return (
    <section className="relative flex min-h-[92vh] flex-col overflow-hidden bg-medicom-navy">
      <div
        className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:56px_56px] opacity-50"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgb(0_168_107/0.16),transparent_42%),radial-gradient(circle_at_85%_10%,rgb(0_61_122/0.3),transparent_38%)]"
        aria-hidden
      />
      <div className="marketing-hero-blob marketing-hero-blob--emerald absolute -left-24 top-32 h-72 w-72 opacity-25" aria-hidden />
      <div className="marketing-hero-blob marketing-hero-blob--navy absolute -right-16 bottom-24 h-56 w-56 opacity-20" aria-hidden />

      <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-6 pb-16 pt-28 lg:pt-32">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 shadow-sm backdrop-blur-sm">
              <Activity className="h-3.5 w-3.5 text-accent" aria-hidden />
              <span className="text-sm font-medium text-white/90">AI-native Healthcare OS for the NHS</span>
            </div>

            <h1 className="mb-5 max-w-2xl text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl md:text-6xl lg:mx-0 lg:max-w-none">
              Clinical workflows,
              <span className="block text-accent">one platform.</span>
            </h1>

            <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-white/80 md:text-xl lg:mx-0">
              Designed for EMIS Web and SystmOne with FHIR R4 ready integration paths. Specialist AI agents draft
              notes, check safety, and coordinate care. Every output needs clinician approval before it reaches the
              record. Demo uses synthetic data.
            </p>

            <div className="mb-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center lg:justify-start">
              <Link
                href="/signup"
                className="rounded-xl bg-emerald px-8 py-3.5 text-center text-base font-bold text-white shadow-card-hover transition-all hover:-translate-y-0.5 hover:bg-emerald/90 sm:min-w-[11rem]"
              >
                Get Started
              </Link>
              <Link
                href="/demo/patel"
                className="rounded-xl border-2 border-white/80 bg-transparent px-8 py-3.5 text-center text-base font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-white/10 sm:min-w-[11rem]"
              >
                See it in action
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
              {trustPoints.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/85 backdrop-blur-sm sm:text-sm"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <div className="hidden sm:block">
            <HeroDashboardMock />
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <div className="bg-gradient-to-b from-transparent via-medicom-navy/60 to-white/95 pt-6">
          <TrustStrip variant="hero" />
        </div>
      </div>
    </section>
  );
}
