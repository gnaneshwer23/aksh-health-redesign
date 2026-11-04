import Link from "next/link";
import { Check } from "lucide-react";

import { ProductSurface } from "@/components/site/canvas/ProductSurface";
import { StatusPill } from "@/components/site/StatusPill";
import { HUMAN_GATES, NON_OBJECTIVES } from "@/components/site/vision";

const LOOP = [
  {
    n: "01",
    title: "Orchestrate the brief",
    body: "Aksh Orchestrator gathers the case, orders safety checks (Aksh Guardian), and prepares a review brief. Decision support only — not a live EHR write.",
  },
  {
    n: "02",
    title: "A named person reviews",
    body: "The honesty strip states whether you are in rules-only, optional LLM, or scaffold mode. Accept, edit or reject. Nothing moves without that decision.",
  },
  {
    n: "03",
    title: "Hand off with an owner",
    body: "Lab and pharmacy queues keep a shared care-episode id. People act through your channels; Aksh does not prescribe or contact patients.",
  },
] as const;

const ROLES = [
  {
    role: "GP / clinician",
    body: "Review queue, honesty strip, treatment-strategy drafts that stop at you.",
    href: "/demo/connected-diabetes",
  },
  {
    role: "Pharmacist",
    body: "Pharmacy review queue — interaction flags held for a prescriber, never auto-Rx.",
    href: "/agents",
  },
  {
    role: "Lab / admin",
    body: "Lab queue with provenance and missing-data honesty; shared run correlation.",
    href: "/platform",
  },
  {
    role: "Practice / ops lead",
    body: "Agent Ops shows live-path vs scaffold vs sim. HCP eval is facilitated, not a release stamp.",
    href: "/security",
  },
] as const;

/**
 * Homepage blocks that explain Milestone A–E surfaces in buyer language:
 * how the loop works, review + strategy visuals, roles, and hard limits.
 * Public product names only (Aksh Orchestrator / Guardian / Shield) — never internal ALL-CAPS ids.
 */
export function LandingHowItWorks() {
  return (
    <section className="s-section" id="how-it-works" data-landing="how-it-works">
      <div className="s-container">
        <div className="s-head">
          <span className="s-eyebrow">How it works</span>
          <h2 className="s-h2">Three steps. A person in the middle.</h2>
          <p className="s-lede">
            Production clinics start with slot fill and glucose worklists. The supervised review line —
            Orchestrator, Guardian, Shield, lab/pharmacy hand-off — is in validation.
          </p>
        </div>
        <ol className="s-loop3">
          {LOOP.map((step) => (
            <li key={step.n} className="s-loop3__item">
              <span className="s-loop3__n" aria-hidden>
                {step.n}
              </span>
              <h3 className="s-h3">{step.title}</h3>
              <p className="s-small">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function LandingReviewAndStrategy() {
  return (
    <section className="s-section s-section--soft" id="review-line" data-landing="review-line">
      <div className="s-container">
        <div className="s-feature">
          <div className="s-feature__copy">
            <span className="s-eyebrow">Supervised review</span>
            <h2 className="s-h2">See the draft. See the honesty strip. Decide.</h2>
            <p className="s-body">
              Aksh Orchestrator prepares the brief. Aksh Guardian holds unsafe paths. The GP review queue
              shows sim versus live-path labels so nobody confuses a simulation or scaffold run with a
              certified clinical claim.
            </p>
            <ul className="s-check">
              <li>
                <Check aria-hidden />
                Every draft cites reasons; missing data stays missing.
              </li>
              <li>
                <Check aria-hidden />
                Decisions are recorded under the signed-in account (Aksh Shield audit).
              </li>
              <li>
                <Check aria-hidden />
                No patient data to AI models in production.
              </li>
            </ul>
            <div className="s-actions">
              <Link href="/agents" className="s-btn s-btn--ghost">
                Meet the agents
              </Link>
              <StatusPill s="in_validation" />
            </div>
          </div>
          <ProductSurface id="review" />
        </div>

        <div className="s-feature s-feature--flip" style={{ marginTop: 96 }}>
          <div className="s-feature__copy">
            <span className="s-eyebrow">Personalised treatment strategy</span>
            <h2 className="s-h2">A draft plan for the consultation — not a prescription.</h2>
            <p className="s-body">
              Structured history and glucose context become talking points a clinician can accept,
              edit or reject. Medicine decisions always need a prescriber. In validation until release
              criteria are met.
            </p>
            <Link href="/demo/connected-diabetes" className="s-link">
              Connected diabetes demo →
            </Link>
          </div>
          <ProductSurface id="strategy" />
        </div>

        <div className="s-feature" style={{ marginTop: 96 }}>
          <div className="s-feature__copy">
            <span className="s-eyebrow">Lab, pharmacy, care episode</span>
            <h2 className="s-h2">Hand-offs keep an owner and a shared run id.</h2>
            <p className="s-body">
              After a clinician decides, lab and pharmacy queues continue the same care episode.
              Queues need a named person. There is no autonomous prescribing and no silent write to
              EMIS or EPS.
            </p>
            <Link href="/platform#capabilities" className="s-link">
              Capability status register →
            </Link>
          </div>
          <ProductSurface id="handoff" />
        </div>
      </div>
    </section>
  );
}

export function LandingRolesAndOps() {
  return (
    <section className="s-section" id="care-teams" data-landing="care-teams">
      <div className="s-container">
        <div className="s-feature">
          <div className="s-feature__copy">
            <span className="s-eyebrow">For care teams</span>
            <h2 className="s-h2">One product, clear jobs by role.</h2>
            <p className="s-body">
              Fourteen specialised agents sound like jargon until you map them to who acts. Here is
              the short version for a first visit.
            </p>
            <ul className="s-role-list">
              {ROLES.map((r) => (
                <li key={r.role}>
                  <Link href={r.href} className="s-role-list__link">
                    <strong>{r.role}</strong>
                    <span>{r.body}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <ProductSurface id="ops" />
        </div>
      </div>
    </section>
  );
}

export function LandingTrustLimits() {
  return (
    <section className="s-section s-dark" id="trust" data-landing="trust">
      <div className="s-container s-feature" style={{ alignItems: "start" }}>
        <div className="s-feature__copy">
          <span className="s-eyebrow">Trust and limits</span>
          <h2 className="s-h2">Aksh prepares the work. A named person decides.</h2>
          <p className="s-body" style={{ color: "rgb(255 255 255 / 0.78)" }}>
            Built for validation and human oversight. We do not claim clinical certification, live
            EPS/EMIS write, or that AI replaces the GP.
          </p>
          <ul className="s-check s-check--on-dark">
            {NON_OBJECTIVES.slice(0, 6).map((line) => (
              <li key={line}>
                <Check aria-hidden />
                {line}
              </li>
            ))}
          </ul>
          <Link href="/security" className="s-btn s-btn--ghost" style={{ justifySelf: "start" }}>
            Security and clinical safety
          </Link>
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          <p className="s-small" style={{ color: "rgb(255 255 255 / 0.65)" }}>
            Decisions that always need a named person
          </p>
          <ol className="s-gates">
            {HUMAN_GATES.map((g, i) => (
              <li key={g.gate} className="s-gate">
                <b>{i + 1}</b>
                <span>
                  <strong>{g.gate}</strong>
                  {g.who}
                </span>
              </li>
            ))}
          </ol>
          <p className="s-small" style={{ color: "rgb(255 255 255 / 0.65)" }}>
            Enforced on the server, not only in the interface.
          </p>
        </div>
      </div>
    </section>
  );
}
