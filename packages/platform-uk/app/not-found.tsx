import Link from "next/link";

import Footer from "@/components/marketing/Footer";
import Navbar from "@/components/marketing/Navbar";

export default function NotFound() {
  return (
    <div className="marketing-site flex min-h-screen flex-col overflow-x-hidden bg-surface">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-6 pt-16">
        <div className="mx-auto max-w-lg text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald">404</p>
          <h1 className="mb-4 text-3xl font-bold text-navy md:text-4xl">Page not found</h1>
          <p className="mb-8 text-base leading-relaxed text-steel">
            The page you requested does not exist or may have been moved. Return to the Aksh Health
            homepage or browse our documentation.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex rounded-xl bg-emerald px-6 py-3 text-sm font-bold text-white shadow-card transition-all hover:-translate-y-0.5 hover:bg-emerald/90"
            >
              Return home
            </Link>
            <Link
              href="/docs"
              className="inline-flex rounded-xl border border-navy/20 px-6 py-3 text-sm font-medium text-navy transition-colors hover:border-navy hover:bg-navy hover:text-white"
            >
              View documentation
            </Link>
            <Link
              href="/signup"
              className="inline-flex rounded-xl border border-emerald/30 px-6 py-3 text-sm font-medium text-emerald transition-colors hover:bg-emerald/5"
            >
              Get started
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
