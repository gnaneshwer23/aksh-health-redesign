import Link from "next/link";
import type { ReactNode } from "react";

import Footer from "@/components/marketing/Footer";
import Navbar from "@/components/marketing/Navbar";

type AudienceHeroProps = {
  kicker: string;
  title: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
  children: ReactNode;
};

export function AudiencePage({ kicker, title, description, ctaHref, ctaLabel, children }: AudienceHeroProps) {
  return (
    <div className="marketing-site flex min-h-screen flex-col bg-surface">
      <Navbar overDarkHero />
      <section className="bg-navy-dark pb-16 pt-28 text-white lg:pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">{kicker}</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold sm:text-5xl">{title}</h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-300">{description}</p>
          {ctaHref && ctaLabel ? (
            <Link
              href={ctaHref}
              className="mt-8 inline-block rounded-xl bg-white px-8 py-3 font-bold text-navy transition-colors hover:bg-white/90"
            >
              {ctaLabel}
            </Link>
          ) : null}
        </div>
      </section>
      <main className="flex-1 bg-white">{children}</main>
      <Footer />
    </div>
  );
}
