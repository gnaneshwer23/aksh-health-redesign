"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { MarketingShell } from "@/components/marketing/MarketingShell";
import TrustStrip from "@/components/marketing/TrustStrip";
import { GOLDEN_SCENARIO_PATEL_DEMO_ID } from "@/lib/agents";

const DEMO_STEPS = [
  {
    id: "midnight-etl",
    title: "Midnight ETL status",
    route: "/dashboard/admin",
    narrative: "Last night while patients slept: synthetic extraction SUCCESS in 6m 39s.",
    demoSection: "§5.1"
  },
  {
    id: "gp-dashboard",
    title: "Clinician dashboard | Mr Patel",
    route: "/dashboard/gp",
    narrative: "Appointment list sorted by ORACLE risk: Mr James Patel (78 HIGH) at top.",
    demoSection: "§5.2–5.3"
  },
  {
    id: "voice-consult",
    title: "VOICE consultation",
    route: "/dashboard/gp?highlight=voice",
    narrative: "Click mic: calf swelling, sugars 12–14, polydipsia transcribed to SYNTHESIS path.",
    demoSection: "§5.4"
  },
  {
    id: "review-queue",
    title: "AI review queue",
    route: "/dashboard/gp?highlight=queue",
    narrative: "Four DRAFT items: SOAP, codes, GUARDIAN URGENT, ORACLE 78→82.",
    demoSection: "§5.5–5.6"
  },
  {
    id: "referral",
    title: "REFERRAL AGENT package",
    route: "/dashboard/gp?highlight=referral",
    narrative: "After SOAP + codes Accept: urgent DVT duplex + D-dimer ServiceRequest draft.",
    demoSection: "§5.8"
  },
  {
    id: "pharmacist",
    title: "Pharmacist view",
    route: "/dashboard/pharmacist",
    narrative: "GUARDIAN medication queue: aspirin + apixaban interaction review.",
    demoSection: "Layer 1"
  },
  {
    id: "admin-audit",
    title: "Admin SHIELD audit",
    route: `/cases/${GOLDEN_SCENARIO_PATEL_DEMO_ID}/evidence`,
    narrative: "AuditEvent manifest: agents activated, zero auto-writes.",
    demoSection: "§5.9"
  },
  {
    id: "voice-care",
    title: "Voice Care Day 3",
    route: "/demo/voice-care-day3",
    narrative: "Outbound call | worsening calf pain + SOB → ORACLE 91 → nurse escalation.",
    demoSection: "§5.10"
  },
  {
    id: "regional",
    title: "Regional population view",
    route: "/dashboard/regional",
    narrative: "Aggregate metrics + EQUITY disparity insights across practices.",
    demoSection: "§5.11"
  }
] as const;

type OverviewDemoLauncherProps = {
  initialStep?: number;
};

export function OverviewDemoLauncher({ initialStep = 0 }: OverviewDemoLauncherProps) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(
    Math.min(Math.max(0, initialStep), DEMO_STEPS.length - 1)
  );

  const step = DEMO_STEPS[stepIndex];
  const progress = useMemo(() => Math.round(((stepIndex + 1) / DEMO_STEPS.length) * 100), [stepIndex]);

  function goToStep(index: number) {
    const next = Math.max(0, Math.min(DEMO_STEPS.length - 1, index));
    setStepIndex(next);
    router.replace(`/demo/patel?step=${next}`, { scroll: false });
  }

  return (
    <MarketingShell overDarkHero>
      <section className="relative overflow-hidden bg-medicom-navy pb-8 pt-24 text-white">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:48px_48px] opacity-50" />
        <div className="relative mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-emerald">Clinical walkthrough</p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            Mr James Patel walkthrough
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/75">
            Ordered synthetic demo from midnight ETL through GP consult, HITL queue, referral package, Voice Care Day-3,
            and regional EQUITY view. Proof-mode only. No production claims.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/85">
              Step {stepIndex + 1} / {DEMO_STEPS.length}
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/85">
              {progress}% complete
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/85">
              Case {GOLDEN_SCENARIO_PATEL_DEMO_ID}
            </span>
          </div>
        </div>
        <TrustStrip variant="hero" />
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <article className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald">{step.demoSection}</p>
            <h2 className="mt-2 text-2xl font-bold text-navy">{step.title}</h2>
            <p className="mt-3 text-steel">{step.narrative}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={step.route}
                className="rounded-xl bg-emerald px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald/90"
              >
                Open step surface
              </Link>
              <button
                className="rounded-xl border border-navy/20 px-5 py-2.5 text-sm font-medium text-navy transition-colors hover:bg-navy/5 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={stepIndex === 0}
                onClick={() => goToStep(stepIndex - 1)}
                type="button"
              >
                Previous
              </button>
              <button
                className="rounded-xl border border-navy/20 px-5 py-2.5 text-sm font-medium text-navy transition-colors hover:bg-navy/5 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={stepIndex >= DEMO_STEPS.length - 1}
                onClick={() => goToStep(stepIndex + 1)}
                type="button"
              >
                Next
              </button>
            </div>
          </article>
        </div>
      </section>

      <section className="bg-surface pb-16 pt-4">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="space-y-4">
            {DEMO_STEPS.map((item, index) => (
              <article
                className={`cursor-pointer rounded-2xl border bg-white p-5 transition-all ${
                  index === stepIndex ? "border-emerald/40 shadow-card" : "border-border hover:border-navy/20"
                }`}
                key={item.id}
                onClick={() => goToStep(index)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") goToStep(index);
                }}
                role="button"
                tabIndex={0}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy/5 text-sm font-bold text-navy">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-emerald">{item.demoSection}</p>
                      <h2 className="mt-1 text-lg font-bold text-navy">{item.title}</h2>
                      <p className="mt-2 text-sm text-steel">{item.narrative}</p>
                    </div>
                  </div>
                  <Link
                    className="shrink-0 rounded-xl border border-navy/20 px-4 py-2 text-sm font-medium text-navy transition-colors hover:bg-navy/5"
                    href={item.route}
                    onClick={(event) => event.stopPropagation()}
                  >
                    Open
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
