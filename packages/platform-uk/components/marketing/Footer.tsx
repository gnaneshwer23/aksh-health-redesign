import Link from "next/link";

const footerColumns = [
  {
    title: "Platform",
    links: [
      { label: "How It Works", href: "/#how-it-works" },
      { label: "For Clinicians", href: "/for-clinicians" },
      { label: "For Hospitals", href: "/for-hospitals" },
      { label: "For Patients", href: "/for-patients" },
      { label: "For Administrators", href: "/for-administrators" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "ICS Pilot", href: "/pilot" },
      { label: "Documentation", href: "/docs" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Contact", href: "/contact" },
    ],
  },
] as const;

export default function Footer() {
  return (
    <footer className="bg-navy-dark py-16 text-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          <div className="md:col-span-2">
            <div className="mb-5 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                <span className="text-sm font-bold text-white">A</span>
              </div>
              <span className="text-lg font-bold text-white">Aksh Health</span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-white/60">
              The AI Healthcare Operating System. Connecting existing NHS infrastructure to a network of specialist
              clinical AI agents.
            </p>
          </div>

          {footerColumns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/80">{col.title}</h4>
              <ul className="list-none space-y-3 p-0">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/55 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col justify-between gap-4 border-t border-white/10 pt-8 md:flex-row md:items-center">
          <p className="text-sm text-white/40">
            © 2026 Aksh Health Ltd · Registered in England & Wales · NHS DCB0129 Safety Case In Progress
          </p>
          <div className="flex flex-wrap gap-2">
            {["DCB0129", "DTAC", "FHIR R4", "NHS CIS2", "UK GDPR"].map((badge) => (
              <span key={badge} className="rounded border border-white/10 px-2.5 py-1 text-xs text-white/40">
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
