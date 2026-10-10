import Link from "next/link";
import { Asterisk } from "lucide-react";

import { COMPLIANCE_DISCLAIMER } from "@/lib/compliance-labels";

const footerColumns = [
  {
    title: "Platform",
    links: [
      { label: "Platform", href: "/platform" },
      { label: "How it works", href: "/platform#loop" },
      { label: "Patel walkthrough", href: "/demo/patel" },
      { label: "Safety & security", href: "/security" },
      { label: "Integrations", href: "/integrations" },
    ],
  },
  {
    title: "Who it is for",
    links: [
      { label: "Physicians & nurses", href: "/for-clinicians" },
      { label: "People with diabetes", href: "/for-patients" },
      { label: "Pharmacists", href: "/for-pharmacists" },
      { label: "Clinics, systems & payers", href: "/for-organisations" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Start free", href: "/signup" },
      { label: "Sign in", href: "/signin" },
      { label: "Go live with your organisation", href: "/get-started" },
      { label: "Contact", href: "/contact" },
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
    <footer className="lv-footer">
      <div className="lv-container">
        <div className="lv-footer__grid">
          <div className="lv-footer__brand">
            <Link href="/" className="lv-nav__brand lv-focus">
              <span className="lv-nav__mark" aria-hidden>
                <Asterisk className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <span className="text-base font-semibold tracking-tight text-white">Aksh Health</span>
            </Link>
            <p>Clinical intelligence, under clinical control. Diabetes-first, beside your EHR.</p>
          </div>

          {footerColumns.map((col) => (
            <div key={col.title} className="lv-footer__col">
              <h4>{col.title}</h4>
              <ul>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="lv-focus">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="lv-footer__legal">
          <p>
            {COMPLIANCE_DISCLAIMER}{" "}
            <Link href="/security" className="underline-offset-2 hover:text-white/70 hover:underline">
              Security &amp; clinical safety
            </Link>
          </p>
          <p>© 2026 Aksh Health Ltd · Registered in England &amp; Wales</p>
        </div>
      </div>
    </footer>
  );
}
