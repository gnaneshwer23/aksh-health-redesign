import Link from "next/link";

import { PublicProductNav } from "@/components/product/public-product-nav";
import { COMPLIANCE_BADGES, COMPLIANCE_DISCLAIMER } from "@/lib/compliance-labels";
import { SEO_DEFAULTS } from "@/lib/compliance-labels";

export const metadata = {
  title: `Pilot Program — ${SEO_DEFAULTS.title}`,
  description: "Join the AkshHealth pilot program for primary care AI workflow with human-in-the-loop review and multi-framework compliance design."
};

export default function PilotPage() {
  return (
    <main className="product-page">
      <PublicProductNav ctaHref="/onboarding" ctaLabel="Start onboarding" />

      <section className="product-simple-hero">
        <p className="product-kicker">Pilot program</p>
        <h1>Bring human-gated clinical AI to your practice.</h1>
        <p>
          AkshHealth stages every agent output as draft FHIR until a clinician Accepts, Edits, or Rejects.
          Pilot sites receive synthetic-capable dashboards, SHIELD audit trails, and EHR connector rehearsal paths.
        </p>
        <div className="product-actions">
          <Link className="product-button product-button--primary" href="/onboarding">
            Apply via onboarding wizard
          </Link>
          <Link className="product-button product-button--secondary" href="/docs">
            Read compliance overview
          </Link>
        </div>
      </section>

      <section className="product-section">
        <p className="product-kicker">Compliance design pathways</p>
        <h2>Built for regional and international governance.</h2>
        <p className="product-muted">{COMPLIANCE_DISCLAIMER}</p>
        <div className="compliance-badge-grid">
          {COMPLIANCE_BADGES.map((badge) => (
            <article className="compliance-badge-card" key={badge.id}>
              <strong>{badge.label}</strong>
              <p>{badge.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="product-section product-split">
        <div>
          <p className="product-kicker">What pilots receive</p>
          <h2>Production-path surfaces without overclaiming.</h2>
        </div>
        <ul className="product-checklist">
          <li>Five role dashboards with HITL review queue</li>
          <li>SHIELD FHIR AuditEvent export on case decisions</li>
          <li>Practice-level tenancy scaffold with Postgres option</li>
          <li>EHR connector status monitoring (synthetic rehearsal)</li>
          <li>Clinical identity provider OAuth scaffold</li>
        </ul>
      </section>
    </main>
  );
}
