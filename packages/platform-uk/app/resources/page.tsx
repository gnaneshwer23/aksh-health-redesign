import type { Metadata } from "next";
import Link from "next/link";

import { GUIDE_GROUPS, GUIDES } from "@/components/site/guides";
import { PageHead } from "@/components/site/PageParts";
import { SiteShell } from "@/components/site/SiteShell";

export const metadata: Metadata = {
  title: "Resources",
  description: "Guides for setting up Aksh, running slot fill and monitoring, connecting your systems, and going live.",
};

const GROUP_LABEL: Record<string, string> = { Start: "Get started", Workflows: "Daily work", Connect: "Connect your systems", Governance: "Governance" };

const FAQ = [
  { q: "Does Aksh contact patients or book appointments?", a: "No. Aksh ranks patients and drafts the offer. Your staff approve it and send it through your own channel, and a booking counts only when your schedule shows it." },
  { q: "Does Aksh replace our records or scheduling system?", a: "No. It works beside them. It can read freed slots and bookings from your scheduling system and glucose data from devices; it writes nothing back." },
  { q: "Is patient data sent to an AI model?", a: "Not in the workflows in production today: ranking, eligibility and glucose metrics are deterministic rules. The platform’s AI capabilities are validated on synthetic data and reach real patients only through an approved go-live with your organisation." },
  { q: "What does go-live involve?", a: "A data processing agreement, a privacy impact assessment, a named clinical safety lead, an agreed patient contact channel and a locked baseline, each reviewed by Aksh before approval." },
  { q: "How do patients join?", a: "Your clinic gives a patient an invite code. They create an account, link it with the code and their date of birth, and choose what to share." },
  { q: "Can we get our data out?", a: "Yes. Organisation admins can export everything the organisation holds at any time, and patients can download their own record." },
];

export default function ResourcesPage() {
  return (
    <SiteShell>
      <PageHead
        eyebrow="Resources"
        title="Guides for your team."
        lede="How to set up Aksh, run slot fill and monitoring day to day, connect your systems, and go live."
        glance={{
          title: "Start here",
          rows: [
            ["New clinic", <Link key="a" href="/resources/getting-started" className="s-link">Getting started</Link>],
            ["IT and integration", <Link key="b" href="/resources/schedule-connector" className="s-link">Schedule connector</Link>],
            ["Governance", <Link key="c" href="/resources/going-live" className="s-link">Going live</Link>],
          ],
        }}
      />

      <section className="s-section s-section--tight">
        <div className="s-container" style={{ display: "grid", gap: 56 }}>
          {GUIDE_GROUPS.map((g) => (
            <div key={g} style={{ display: "grid", gap: 20 }}>
              <div className="s-sectitle"><span className="s-num">{String(GUIDE_GROUPS.indexOf(g) + 1).padStart(2, "0")}</span><h2 className="s-h3" style={{ fontSize: 22 }}>{GROUP_LABEL[g]}</h2></div>
              <div className="s-grid s-grid--3">
                {GUIDES.filter((x) => x.group === g).map((x) => (
                  <Link key={x.slug} href={`/resources/${x.slug}`} className="s-card s-card--link" data-guide-card>
                    <h3 className="s-h3">{x.title}</h3>
                    <p className="s-small">{x.summary}</p>
                    <span className="s-link" style={{ fontSize: 14 }}>Read the guide →</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="s-section s-section--soft" id="faq">
        <div className="s-container">
          <div className="s-head">
            <span className="s-eyebrow">Questions</span>
            <h2 className="s-h2">Common questions</h2>
          </div>
          <div className="s-faq">
            {FAQ.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
