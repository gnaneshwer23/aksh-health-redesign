import Link from "next/link";

const footerLinks = {
  Platform: [
    { href: "/platform", label: "Architecture" },
    { href: "/docs", label: "Documentation" },
    { href: "/pilot", label: "Pilot Programme" },
  ],
  Audiences: [
    { href: "/for-clinicians", label: "For Clinicians" },
    { href: "/for-hospitals", label: "For Hospitals" },
    { href: "/for-patients", label: "For Patients" },
    { href: "/for-administrators", label: "For Administrators" },
  ],
  Company: [
    { href: "/signup", label: "Sign In" },
    { href: "/pilot/apply", label: "Request Pilot" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-lg font-bold text-primary">Aksh Health</p>
            <p className="text-sm text-secondary">Healthcare OS</p>
            <p className="mt-3 text-sm text-muted">
              Healthcare Has Data. Now It Has Intelligence.
            </p>
          </div>
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <p className="font-semibold text-foreground">{section}</p>
              <ul className="mt-3 space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-border pt-6 text-sm text-muted">
          <p>
            © {new Date().getFullYear()} Aksh Health. NHS DCB0129 Compliant ·
            FHIR R4 Native · Human-in-the-Loop.
          </p>
        </div>
      </div>
    </footer>
  );
}
