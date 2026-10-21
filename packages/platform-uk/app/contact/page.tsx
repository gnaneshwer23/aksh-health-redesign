import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Mail } from "lucide-react";

import { PageHero } from "@/components/site/PageHero";
import { SiteShell } from "@/components/site/SiteShell";

export const metadata: Metadata = {
  title: "Contact",
  description: "Talk to Aksh Health about bringing Aksh to your clinic, security and data protection, or support.",
};

const ROUTES = [
  { icon: Building2, title: "Request a pilot", body: "Tell us about your diabetes service. We will arrange a call to scope a pilot around one workflow.", href: "/get-started", cta: "Request a pilot" },
  { icon: Mail, title: "Email us", body: "Security and data protection questions, a vulnerability report, partnerships or anything else.", href: "mailto:gnaneshwer.jadav@gmail.com", cta: "gnaneshwer.jadav@gmail.com" },
];

export default function ContactPage() {
  return (
    <SiteShell>
      <PageHero title="Talk to us." lede="Choose the route that fits and the right person will reply.">
        <dl className="s-facts-inline">
          <div><dt>A new clinic</dt><dd>{<Link key="a" href="/get-started" className="s-link">Request a pilot</Link>}</dd></div>
          <div><dt>Security or data protection</dt><dd>Email, below</dd></div>
          <div><dt>Vulnerability report</dt><dd>Email, below</dd></div>
        </dl>
      </PageHero>
      <section className="s-section s-section--tight">
        <div className="s-container">
          <div className="s-grid s-grid--2">
            {ROUTES.map(({ icon: Icon, title, body, href, cta }) => (
              <div key={title} className="s-card">
                <span className="s-icon"><Icon /></span>
                <h2 className="s-h3">{title}</h2>
                <p className="s-small">{body}</p>
                {href.startsWith("/") ? <Link href={href} className="s-link">{cta} →</Link> : <a href={href} className="s-link">{cta}</a>}
              </div>
            ))}
          </div>
          <p className="s-small" style={{ marginTop: 40 }}>
            Looking for how something works? The <Link href="/resources" className="s-link">guides</Link> cover setup, daily work, connections and go-live.
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
