import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-navy-dark py-16 text-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center gap-2">
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
          {[
            {
              title: "Platform",
              links: [
                ["How It Works", "/#how-it-works"],
                ["For Clinicians", "/for-clinicians"],
                ["For Hospitals", "/for-hospitals"],
                ["For Patients", "/for-patients"],
              ],
            },
            {
              title: "Company",
              links: [
                ["ICS Pilot", "/pilot"],
                ["Documentation", "/docs"],
                ["Privacy Policy", "/privacy"],
                ["Contact", "/contact"],
              ],
            },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/80">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-white/50 transition-colors hover:text-white">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-sm text-white/40">
            © 2026 Aksh Health Ltd · Registered in England & Wales · NHS DCB0129 Safety Case In Progress
          </p>
          <div className="flex flex-wrap gap-2">
            {["DCB0129", "DTAC", "FHIR R4", "NHS CIS2", "UK GDPR"].map((badge) => (
              <span key={badge} className="rounded border border-white/10 px-2 py-0.5 text-xs text-white/40">
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
