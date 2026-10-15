import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteShell } from "@/components/site/SiteShell";
import { isProofEnvironment } from "@/lib/env/proof";

export const metadata: Metadata = {
  title: "Clinical-proof environment",
  description: "Where Aksh clinical features are tested on synthetic patients. No real patients.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const PATHS = [
  {
    title: "The Patel walkthrough",
    body: "One synthetic patient from signal to a clinician's decision: CONDUCTOR runs the agents, GUARDIAN checks safety, a named clinician approves or rejects. Nothing is written to a record.",
    href: "/demo/patel",
    cta: "Open the walkthrough",
  },
  {
    title: "Aksh Diabetes on a care-network patient",
    body: "Create a sandbox clinic, open a patient in the care network and run a clinical review. Trusted CGM and verified HbA1c from the record feed the diabetes signals.",
    href: "/signup",
    cta: "Create a sandbox account",
  },
  {
    title: "The precision-health loop",
    body: "Signals, scenario ranking and the safety route across the synthetic cohort, with the model card and limitations beside every output.",
    href: "/demo/precision-health-loop",
    cta: "Open the loop",
  },
  {
    title: "Clinician dashboards",
    body: "The GP and care-network views over the 100-patient synthetic cohort.",
    href: "/dashboard/gp",
    cta: "Open the GP view",
  },
];

const LIMITS = [
  "Synthetic data only: the 100-patient cohort and sandbox clinics. Real patient data is refused by design, and this environment cannot reach production.",
  "Agent outputs are drafts for a clinician. No EHR write, no message to a patient, no autonomous decision.",
  "Clinical features are in validation. It is not available to clinics in production until an approved go-live: clinical safety case, DPIA and regulatory opinion.",
  "Figures shown here describe the synthetic world. They are not evidence of clinical effect.",
];

export default function ProofPage() {
  if (!isProofEnvironment()) notFound();
  return (
    <SiteShell>
      <section className="s-page-head">
        <div className="s-container s-page-head__inner">
          <span className="s-eyebrow">Clinical-proof environment</span>
          <h1 className="s-h1" style={{ fontSize: "clamp(34px, 4.4vw, 52px)" }}>See the clinical layer work, on synthetic patients.</h1>
          <p className="s-lede">
            This is where Aksh clinical features are tested before any clinic uses them: the agents, Aksh
            Diabetes and the human gates, running end to end on a synthetic world. It is separate from the product clinics
            use, which runs patient access in shadow mode and has the clinical agents switched off.
          </p>
        </div>
      </section>

      <section className="s-section">
        <div className="s-container">
          <div className="s-grid s-grid--2">
            {PATHS.map((p) => (
              <Link key={p.href} href={p.href} className="s-card s-card--link">
                <h2 className="s-h3">{p.title}</h2>
                <p className="s-body">{p.body}</p>
                <span className="s-link">{p.cta} →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="s-section s-section--soft">
        <div className="s-container">
          <h2 className="s-h2">What this environment is not</h2>
          <ul className="s-limits">
            {LIMITS.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      </section>
    </SiteShell>
  );
}
