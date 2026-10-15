import Link from "next/link";

const COLUMNS = [
  {
    title: "Platform",
    links: [
      { label: "How it works", href: "/platform" },
      { label: "Aksh Diabetes", href: "/#diabetes" },
      { label: "Available now", href: "/product" },
      { label: "Cancelled-slot fill", href: "/product#slot-fill" },
      { label: "Measured results", href: "/product#results" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Guides", href: "/resources" },
      { label: "Schedule connector", href: "/resources/schedule-connector" },
      { label: "Going live", href: "/resources/going-live" },
      { label: "Security", href: "/security" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Contact", href: "/contact" },
      { label: "Request access", href: "/get-started" },
      { label: "Sign in", href: "/signin" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Cookies", href: "/cookies" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="s-footer">
      <div className="s-container">
        <div className="s-footer__grid">
          <div className="s-footer__brand" style={{ display: "grid", gap: 14, alignContent: "start" }}>
            <Link href="/" className="s-brand" aria-label="Aksh Health home">
              <span className="s-brand__mark" aria-hidden>A</span>
              Aksh Health
            </Link>
            <p className="s-small" style={{ maxWidth: 320 }}>
              Clinical intelligence, under clinical control. Worklists and drafts beside your records system, decided by
              your clinicians. First module: Aksh Diabetes.
            </p>
          </div>
          {COLUMNS.map((c) => (
            <div key={c.title} className="s-footer__col">
              <h3>{c.title}</h3>
              <ul>
                {c.links.map((l) => (
                  <li key={l.href}><Link href={l.href}>{l.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="s-footer__base">
          <span>© {new Date().getFullYear()} Aksh Health Ltd</span>
          <span>Aksh supports clinical teams. It does not diagnose, prescribe or contact patients on its own.</span>
        </div>
      </div>
    </footer>
  );
}
