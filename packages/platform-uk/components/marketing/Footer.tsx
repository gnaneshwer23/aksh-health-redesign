import Link from "next/link";

import { COMPLIANCE_DISCLAIMER } from "@/lib/compliance-labels";

const footerColumns = [
  {
    title: "Explore",
    links: [
      { label: "Platform", href: "/platform" },
      { label: "Workflow", href: "/how-it-works" },
      { label: "Resources", href: "/resources" },
      { label: "FAQ", href: "/faq" },
      { label: "Ask Aksh Health", href: "/chat" },
      { label: "How we price", href: "/pricing" },
      { label: "Book a walkthrough", href: "/walkthrough" },
    ],
  },
  {
    title: "Audiences",
    links: [
      { label: "Clinicians", href: "/for-clinicians" },
      { label: "Practices", href: "/for-practices" },
      { label: "Administrators", href: "/for-administrators" },
      { label: "Hospitals", href: "/for-hospitals" },
      { label: "ICS leads", href: "/for-ics" },
      { label: "Research", href: "/for-research" },
      { label: "Patients", href: "/for-patients" },
    ],
  },
  {
    title: "Trust & legal",
    links: [
      { label: "Security & safety", href: "/security" },
      { label: "Integrations", href: "/integrations" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
    ],
  },
  {
    title: "Get started",
    links: [
      { label: "Book a demonstration", href: "/get-started" },
      { label: "Create account", href: "/signup" },
      { label: "View demo", href: "/demo/patel" },
      { label: "Book a walkthrough", href: "/walkthrough" },
      { label: "Contact", href: "/contact" },
      { label: "Sign in", href: "/signin" },
    ],
  },
] as const;

export default function Footer() {
  return (
    <footer className="owkin-footer">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="mb-12 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30">
            <span className="text-sm font-bold text-white">A</span>
          </div>
          <span className="text-lg font-semibold tracking-wide text-white">Aksh Health</span>
        </div>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-base font-semibold text-white">{col.title}</h4>
              <ul className="list-none space-y-3 p-0">
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

        <div className="mt-12 border-t border-white/15 pt-8">
          <p className="max-w-3xl text-xs leading-relaxed text-white/55">
            {COMPLIANCE_DISCLAIMER}{" "}
            <Link href="/resources" className="underline-offset-2 hover:text-white hover:underline">
              View platform resources
            </Link>
          </p>
          <p className="mt-4 text-sm text-white/45">
            © 2026 Aksh Health Ltd · Registered in England & Wales · Designed for NHS organisations
          </p>
        </div>
      </div>
    </footer>
  );
}
