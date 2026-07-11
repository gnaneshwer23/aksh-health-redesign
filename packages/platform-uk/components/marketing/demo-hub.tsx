import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";

import { MarketingShell } from "@/components/marketing/MarketingShell";
import TrustStrip from "@/components/marketing/TrustStrip";
import { PUBLIC_DEMOS } from "@/lib/demo-catalog";

export function DemoHub() {
  return (
    <MarketingShell>
      <section className="relative overflow-hidden bg-medicom-navy pb-12 pt-8 text-white">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:48px_48px] opacity-50" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-emerald">Product demonstrations</p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            See Aksh Health in action
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/75">
            Explore synthetic-safe demonstrations of clinical workflows, safety review, and patient monitoring. Every
            output stays in a clinician-in-the-loop path. No live patient data and no production EHR connections in
            these walkthroughs.
          </p>
        </div>
        <TrustStrip />
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12 max-w-2xl">
            <h2 className="text-3xl font-bold text-navy">Choose a walkthrough</h2>
            <p className="mt-3 text-steel">
              Each demo uses fictional patients and staged clinical scenarios. Open a card to follow the guided path at
              your own pace.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PUBLIC_DEMOS.map((demo) => (
              <article
                key={demo.id}
                className="flex flex-col rounded-2xl border border-border bg-surface p-6 shadow-sm transition-shadow hover:shadow-card"
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald">{demo.category}</p>
                <h3 className="mt-2 text-xl font-bold text-navy">{demo.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-steel">{demo.description}</p>
                <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-steel">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {demo.duration}
                </p>
                <Link
                  href={demo.href}
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald px-5 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-emerald/90"
                >
                  Open demo
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>

          <p className="mt-10 rounded-2xl border border-border bg-medicom-surface px-5 py-4 text-sm leading-relaxed text-steel">
            <span className="font-semibold text-navy">Synthetic-safe only.</span> Demonstrations use fictional patients
            and staged outputs. They do not connect to live NHS systems or real health records.
          </p>
        </div>
      </section>

      <section className="bg-emerald py-16 text-center text-white">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-3xl font-bold">Ready to discuss your organisation?</h2>
          <p className="mt-4 text-sm text-white/80">
            Create an account to explore role dashboards, or speak with our team about deployment for your practice or
            trust.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-xl bg-white px-8 py-3.5 text-base font-bold text-emerald transition-colors hover:bg-white/90"
            >
              Create account
            </Link>
            <Link
              href="/get-started"
              className="rounded-xl border-2 border-white/80 px-8 py-3.5 text-base font-bold text-white transition-colors hover:bg-white/10"
            >
              Organisation enquiry
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
