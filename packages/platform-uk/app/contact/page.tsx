import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Mail } from "lucide-react";

import { PageHead } from "@/components/site/PageParts";
import { SiteShell } from "@/components/site/SiteShell";

export const metadata: Metadata = {
  title: "Contact",
  description: "Talk to Aksh Health about bringing Aksh to your clinic, security and data protection, or support.",
};

const ROUTES = [
  { icon: Building2, title: "Bring Aksh to your clinic", body: "Tell us about your diabetes service and how cancellations work today. We will arrange a call with the right person.", href: "/get-started", cta: "Request access" },
  { icon: Mail, title: "Email us", body: "Security and data protection questions, a vulnerability report, partnerships or anything else.", href: "mailto:gnaneshwer.jadav@gmail.com", cta: "gnaneshwer.jadav@gmail.com" },
];

export default function ContactPage() {
  return (
    <SiteShell>
      <PageHead
        eyebrow="Contact"
        title="Talk to us."
        lede="Choose the route that fits and the right person will reply."
        glance={{
          title: "Who to contact",
          rows: [
            ["A new clinic", <Link key="a" href="/get-started" className="s-link">Request access</Link>],
            ["Security or data protection", "Email, below"],
            ["Vulnerability report", "Email, below"],
          ],
        }}
      />
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
