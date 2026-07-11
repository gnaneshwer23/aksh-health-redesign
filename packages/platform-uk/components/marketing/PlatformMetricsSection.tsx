import { Activity, Clock, ShieldCheck, Sparkles } from "lucide-react";

import { MarketingSectionHeader } from "@/components/marketing/MarketingSectionHeader";
import { PastelCapabilityCard } from "@/components/marketing/PastelCapabilityCard";
import type { PastelVariant } from "@/components/marketing/PastelCapabilityCard";

const metrics: Array<{
  label: string;
  value: string;
  icon: typeof Sparkles;
  variant: PastelVariant;
}> = [
  { label: "Agent outputs drafted", value: "12", icon: Sparkles, variant: "mint" },
  { label: "Review queue turnaround", value: "HITL", icon: Clock, variant: "blue" },
  { label: "Every output audited", value: "100%", icon: ShieldCheck, variant: "lavender" },
  { label: "FHIR resources staged", value: "R4", icon: Activity, variant: "peach" },
];

const activity = [
  { day: "Mon", value: 42 },
  { day: "Tue", value: 58 },
  { day: "Wed", value: 51 },
  { day: "Thu", value: 67 },
  { day: "Fri", value: 74 },
  { day: "Sat", value: 33 },
  { day: "Sun", value: 28 },
] as const;

const maxValue = Math.max(...activity.map((a) => a.value));

export default function PlatformMetricsSection() {
  return (
    <section className="marketing-soft-surface py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-16">
          <div>
            <MarketingSectionHeader
              align="left"
              className="mb-0 md:mb-0"
              label="Platform overview"
              title="Visibility into every agent, every review"
              description="Practice managers and ICS leads get a live view of agent throughput and review queue activity, without leaving the platform."
            />

            <div className="mt-8 grid grid-cols-2 gap-4">
              {metrics.map((metric) => (
                <PastelCapabilityCard
                  key={metric.label}
                  variant={metric.variant}
                  icon={metric.icon}
                  title={metric.value}
                  description={metric.label}
                  compact
                />
              ))}
            </div>
          </div>

          <div className="marketing-hero-card rounded-2xl border border-border-subtle bg-white p-6 shadow-xl shadow-navy/10 sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-steel/70">This week</p>
                <p className="mt-0.5 text-sm font-semibold text-navy">Review queue activity</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald/20 bg-emerald/[0.08] px-2.5 py-1 text-[11px] font-medium text-emerald">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald" aria-hidden />
                Live
              </span>
            </div>

            <div className="flex items-end justify-between gap-2 sm:gap-3">
              {activity.map((point) => (
                <div key={point.day} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-32 w-full items-end sm:h-40">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-navy to-emerald transition-all"
                      style={{ height: `${(point.value / maxValue) * 100}%` }}
                      aria-hidden
                    />
                  </div>
                  <span className="text-[11px] font-medium text-steel">{point.day}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-2 border-t border-border-subtle pt-4">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald" aria-hidden />
              <p className="text-xs text-steel">Illustrative activity; every output still requires clinician sign-off</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
