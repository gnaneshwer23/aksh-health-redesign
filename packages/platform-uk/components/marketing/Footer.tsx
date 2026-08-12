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
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <div className="mb-10 flex items-baseline gap-3">
          <span className="text-lg font-semibold tracking-tight text-white">Aksh Health</span>
          <span className="text-sm text-white/45">Diabetes &amp; care coordination</span>
        </div>

        <div className="grid gap-10 sm:grid-cols-3 lg:gap-16">
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-sm font-medium uppercase tracking-[0.08em] text-white/55">{col.title}</h4>
              <ul className="list-none space-y-2.5 p-0">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-white/75 transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-white/12 pt-8">
          <p className="max-w-3xl text-xs leading-relaxed text-white/45">
            {COMPLIANCE_DISCLAIMER}{" "}
            <Link href="/security" className="underline-offset-2 hover:text-white/70 hover:underline">
              Security &amp; clinical safety
            </Link>
          </p>
          <p className="mt-4 text-sm text-white/40">
            © 2026 Aksh Health Ltd · Registered in England &amp; Wales
          </p>
        </div>
      </div>
    </footer>
  );
}
