import type { Metadata } from "next";
import Link from "next/link";

import Footer from "@/components/marketing/Footer";
import Navbar from "@/components/marketing/Navbar";

export const metadata: Metadata = {
  title: "NHS Phase 1 Pilot",
  description: "NHS Phase 1 Pilot — October 2026. Three ICS sites across urban, suburban, and rural settings.",
};

const sites = [
  { name: "Urban ICS Site", detail: "50 clinicians, 1,600 patients, EMIS Web integration" },
  { name: "Suburban ICS Site", detail: "50 clinicians, 1,600 patients, SystmOne integration" },
  { name: "Rural ICS Site", detail: "50 clinicians, 1,600 patients, EMIS Web or SystmOne" },
];

const metrics = [
  "Reduction in avoidable admissions",
  "Documentation time saved per consultation",
  "Care coordination speed improvement",
  "Patient engagement rate",
];

const provided = [
  "Dedicated implementation team",
  "CSO clinical safety support",
  "Quarterly data reports",
  "No upfront cost for pilot sites",
];

export default function PilotPage() {
  return (
    <div className="marketing-site flex min-h-screen flex-col bg-surface">
      <Navbar />
      <main className="flex-1 pt-16">
        <section className="bg-navy-dark py-16 text-white lg:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">Pilot Programme</p>
            <h1 className="mt-3 text-4xl font-bold sm:text-5xl">NHS Phase 1 Pilot — October 2026</h1>
            <p className="mt-6 max-w-2xl text-lg text-slate-300">
              Three Integrated Care System sites — urban, suburban, and rural — deploying Aksh Health across GP networks
              with EMIS Web and SystmOne.
            </p>
            <Link
              href="/pilot/apply"
              className="mt-8 inline-block rounded-xl bg-white px-8 py-3 font-bold text-navy transition-colors hover:bg-white/90"
            >
              Apply for Pilot Cohort
            </Link>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-navy">Three pilot sites</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {sites.map((site) => (
                <article key={site.name} className="rounded-2xl border border-border p-6">
                  <h3 className="font-bold text-navy">{site.name}</h3>
                  <p className="mt-2 text-sm text-steel">{site.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-surface py-16">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-2 lg:px-8">
            <div>
              <h2 className="text-2xl font-bold text-navy">Success metrics</h2>
              <ul className="mt-6 space-y-2">
                {metrics.map((metric) => (
                  <li key={metric} className="flex gap-2 text-steel">
                    <span className="text-emerald">✓</span>
                    {metric}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-navy">What we provide</h2>
              <ul className="mt-6 space-y-2">
                {provided.map((item) => (
                  <li key={item} className="flex gap-2 text-steel">
                    <span className="text-emerald">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
