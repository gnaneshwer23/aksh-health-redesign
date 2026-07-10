import Link from "next/link";

import { PublicProductNav } from "@/components/product/public-product-nav";

export default function ForCliniciansPage() {
  return (
    <main className="product-page">
      <PublicProductNav ctaHref="/signup?role=gp" ctaLabel="Sign up as GP" />

      <section className="product-simple-hero">
        <p className="product-kicker">For clinicians · Phase A stub</p>
        <h1>AI-assisted review, always human-gated.</h1>
        <p>
          VOICE captures the consultation. SYNTHESIS drafts SOAP. DrASSIST suggests codes. GUARDIAN flags interactions.
          ORACLE updates risk. You Accept, Edit, or Reject every output before it touches the record.
        </p>
        <div className="product-actions">
          <Link className="product-button product-button--primary" href="/gp-dashboard">
            Try GP dashboard demo
          </Link>
          <Link className="product-button product-button--secondary" href="/onboarding?role=gp">
            GP onboarding path
          </Link>
        </div>
      </section>

      <section className="product-section">
        <p className="product-kicker">Agent workflow (synthetic proof)</p>
        <h2>Seven agents, one review queue.</h2>
        <p>Full production orchestration (LangGraph, Medplum) is Phase D. This build demonstrates the HITL patient journey.</p>
        <ol>
          <li>VOICE — transcript intake</li>
          <li>SYNTHESIS — SOAP draft</li>
          <li>DrASSIST — SNOMED / ICD-10 suggestions</li>
          <li>GUARDIAN — DDI and allergy alerts</li>
          <li>ORACLE — risk score update</li>
          <li>SHIELD — audit on every decision</li>
        </ol>
      </section>
    </main>
  );
}
