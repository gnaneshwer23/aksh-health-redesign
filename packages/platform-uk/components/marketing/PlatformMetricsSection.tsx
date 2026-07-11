import { Activity, Clock, ShieldCheck, Sparkles } from "lucide-react";

const metrics = [
  { label: "Agent outputs drafted", value: "12", icon: Sparkles, tone: "text-emerald" },
  { label: "Review queue turnaround", value: "HITL", icon: Clock, tone: "text-navy" },
  { label: "Every output audited", value: "100%", icon: ShieldCheck, tone: "text-emerald" },
  { label: "FHIR resources staged", value: "R4", icon: Activity, tone: "text-navy" },
] as const;

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
            <p className="marketing-section-label mb-3">Platform overview</p>
            <h2 className="max-w-md text-3xl font-bold leading-[1.15] tracking-tight text-navy md:text-4xl">
              Visibility into every agent, every review
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-steel">
              Practice managers and ICS leads get a live view of agent throughput and review queue activity, without
              leaving the platform.
            </p>

            <dl className="mt-8 grid grid-cols-2 gap-4">
              {metrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <div key={metric.label} className="rounded-2xl border border-border-subtle bg-white p-5">
                    <Icon className={`h-4 w-4 ${metric.tone}`} aria-hidden />
                    <dd className="mt-2 text-xl font-bold text-navy">{metric.value}</dd>
                    <dt className="mt-1 text-xs leading-relaxed text-steel">{metric.label}</dt>
                  </div>
                );
              })}
            </dl>
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
