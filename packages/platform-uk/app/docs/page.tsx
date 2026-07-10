import Link from "next/link";

import { PublicProductNav } from "@/components/product/public-product-nav";
import { COMPLIANCE_BADGES, COMPLIANCE_DISCLAIMER, SEO_DEFAULTS } from "@/lib/compliance-labels";

export const metadata = {
  title: `Documentation — ${SEO_DEFAULTS.title}`,
  description: "Architecture overview, FHIR resources, HITL specification, and compliance design pathways for AkshHealth."
};

export default function DocsPage() {
  return (
    <main className="product-page">
      <PublicProductNav ctaHref="/pilot" ctaLabel="Pilot program" />

      <section className="product-simple-hero">
        <p className="product-kicker">Documentation portal · v1</p>
        <h1>Compliance-aware clinical AI architecture.</h1>
        <p>
          Public documentation stub for architecture, FHIR R4 staging, human-in-the-loop review, and integration placeholders.
          Internal clinical safety evidence remains confidential.
        </p>
      </section>

      <section className="product-section product-split">
        <div>
          <p className="product-kicker">Architecture</p>
          <h2>Five layers, seven agents, one review queue.</h2>
          <p>
            Consultation intake flows through named clinical agents (VOICE, SYNTHESIS, DrASSIST, GUARDIAN, ORACLE, EQUITY, SHIELD).
            Outputs land in a draft review queue. No autonomous write-back to active clinical records.
          </p>
        </div>
        <div className="docs-link-stack">
          <Link href="/gp-dashboard">Clinician dashboard demo</Link>
          <Link href="/review">Review queue</Link>
          <Link href="/api/system/database-contract">Database adapter contract</Link>
          <Link href="/api/system/integration-contract">Integration boundary contract</Link>
        </div>
      </section>

      <section className="product-section">
        <p className="product-kicker">FHIR R4 resources (staged)</p>
        <h2>Draft resources until human approval.</h2>
        <ul>
          <li>Encounter, Condition, MedicationRequest, Observation — collection bundle export</li>
          <li>AuditEvent — SHIELD compliance trail on Accept / Edit / Reject</li>
          <li>DocumentReference — SYNTHESIS SOAP output (review queue)</li>
          <li>RiskAssessment — ORACLE score updates</li>
        </ul>
      </section>

      <section className="product-section">
        <p className="product-kicker">HITL specification</p>
        <h2>Accept · Edit · Reject on every agent output.</h2>
        <p>
          Queue items carry agent badges and DRAFT status until a named reviewer records a decision.
          Full case Accept freezes evidence artifacts and appends FHIR AuditEvent resources to the export bundle.
        </p>
      </section>

      <section className="product-section">
        <p className="product-kicker">Compliance frameworks (design alignment)</p>
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

      <section className="product-section">
        <p className="product-kicker">Integration placeholders</p>
        <h2>EHR connectors and clinical event bus — planned.</h2>
        <p>
          EHR connector adapters, clinical event streaming, and production FHIR server sync are rehearsal-flagged.
          See integration contract API for current boundary status.
        </p>
      </section>
    </main>
  );
}
