import Link from "next/link";

import { COMPLIANCE_DISCLAIMER } from "@/lib/compliance-labels";

const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "Platform", href: "/platform" },
      { label: "Security", href: "/security" },
      { label: "Demo", href: "/demo/patel" },
      { label: "Get started", href: "/get-started" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Contact", href: "/contact" },
      { label: "Sign in", href: "/signin" },
      { label: "Create account", href: "/signup" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
    ],
  },
] as const;

export default function Footer() {
  return (
    <footer className="owkin-footer">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="mb-12 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30">
            <span className="text-sm font-medium text-white">A</span>
          </div>
          <span className="text-lg font-medium tracking-wide text-white">Aksh Health</span>
        </div>

        <div className="grid gap-10 sm:grid-cols-3 lg:gap-16">
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-base font-medium text-white">{col.title}</h4>
              <ul className="list-none space-y-3 p-0">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm font-normal text-white/75 transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-white/15 pt-8">
          <p className="max-w-3xl text-xs leading-relaxed text-white/55">
            {COMPLIANCE_DISCLAIMER}{" "}
            <Link href="/security" className="underline-offset-2 hover:text-white hover:underline">
              Security &amp; clinical safety
            </Link>
          </p>
          <p className="mt-4 text-sm text-white/45">
            © 2026 Aksh Health Ltd · Registered in England &amp; Wales · Designed for NHS organisations
          </p>
        </div>
      </div>
    </footer>
  );
}
