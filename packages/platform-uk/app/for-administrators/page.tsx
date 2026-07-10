import Link from "next/link";

import { PublicProductNav } from "@/components/product/public-product-nav";

export default function ForAdministratorsPage() {
  return (
    <main className="product-page">
      <PublicProductNav ctaHref="/signup?role=admin" ctaLabel="Sign up as Admin" />

      <section className="product-simple-hero">
        <p className="product-kicker">For administrators · Phase A stub</p>
        <h1>Multi-tenancy, integration health, and SHIELD.</h1>
        <p>
          Practice-level tenancy, EMIS/Mirth integration status, and SHIELD compliance evidence — scaffolded for Phase B.
          No live DSPT evidence export in this build.
        </p>
        <div className="product-actions">
          <Link className="product-button product-button--primary" href="/dashboard/admin">
            Admin dashboard scaffold
          </Link>
          <Link className="product-button product-button--secondary" href="/review/governance-pack">
            Governance pack preview
          </Link>
        </div>
      </section>

      <section className="product-section">
        <p className="product-kicker">Integration boundary</p>
        <h2>EMIS → Mirth → FHIR → HITL (planned)</h2>
        <p>
          Production interoperability is Phase E. Current proof uses synthetic patients and JSON persistence with
          integration placeholders only.
        </p>
      </section>
    </main>
  );
}
