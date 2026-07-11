import Link from "next/link";

import { MarketingShell } from "@/components/marketing/MarketingShell";

export default function NotFound() {
  return (
    <MarketingShell>
      <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald">404</p>
        <h1 className="mt-3 text-3xl font-bold text-navy sm:text-4xl">Page not found</h1>
        <p className="mt-4 max-w-md text-steel">
          The page you requested does not exist or may have moved. Return to the homepage to explore the platform.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-xl bg-navy px-8 py-3 font-bold text-white transition-colors hover:bg-navy/90"
        >
          Return home
        </Link>
      </main>
    </MarketingShell>
  );
}
