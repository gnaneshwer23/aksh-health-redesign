import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-navy-dark text-white py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="font-bold text-white text-lg">Aksh Health</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed max-w-sm">
              The AI Healthcare Operating System. Connecting existing NHS infrastructure
              to a network of specialist clinical AI agents.
            </p>
          </div>
          {[
            {
              title: "Platform",
              links: [["How It Works", "/#how-it-works"], ["For Clinicians", "/for-clinicians"], ["For Hospitals", "/for-hospitals"], ["For Patients", "/for-patients"]],
            },
            {
              title: "Company",
              links: [["ICS Pilot", "/pilot"], ["Documentation", "/docs"], ["Privacy Policy", "/privacy"], ["Contact", "/contact"]],
            },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-semibold text-white/80 text-sm uppercase tracking-wider mb-4">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-white/50 hover:text-white text-sm transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between gap-4">
          <p className="text-white/40 text-sm">
            © 2026 Aksh Health Ltd · Registered in England & Wales · NHS DCB0129 Safety Case In Progress
          </p>
          <div className="flex gap-2 flex-wrap">
            {["DCB0129", "DTAC", "FHIR R4", "NHS CIS2", "UK GDPR"].map((badge) => (
              <span key={badge} className="text-xs text-white/40 border border-white/10 rounded px-2 py-0.5">
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
