import Link from "next/link";

import { MarketingShell } from "@/components/marketing/MarketingShell";

export default function NotFound() {
  return (
    <MarketingShell>
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="mx-auto max-w-lg text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald">404</p>
          <h1 className="mb-4 text-3xl font-bold text-navy md:text-4xl">Page not found</h1>
          <p className="mb-8 text-base leading-relaxed text-steel">
            The page you requested does not exist or may have been moved. Return home or open the platform overview.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex rounded-xl bg-emerald px-6 py-3 text-sm font-bold text-white shadow-card transition-all hover:-translate-y-0.5 hover:bg-emerald/90"
            >
              Return home
            </Link>
            <Link
              href="/platform"
              className="inline-flex rounded-xl border border-navy/20 px-6 py-3 text-sm font-medium text-navy transition-colors hover:border-navy hover:bg-navy hover:text-white"
            >
              View platform
            </Link>
            <Link
              href="/signup"
              className="inline-flex rounded-xl border border-emerald/30 px-6 py-3 text-sm font-medium text-emerald transition-colors hover:bg-emerald/5"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}
