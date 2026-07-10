import Link from "next/link";

import { PublicProductNav } from "@/components/product/public-product-nav";

const demoStops = [
  {
    time: "00:00",
    title: "Frame the product",
    route: "/",
    action: "Use the landing page only to position Aksh Health as a review-first clinical workflow product and to state the synthetic proof boundary.",
    talkTrack: "Keep this short. The landing page explains category, workflow, and boundaries. It should not become the operational demo itself."
  },
  {
    time: "01:00",
    title: "Translate into operator views",
    route: "/dashboards",
    action: "Open dashboards to show which internal surfaces are for command, clinical review, operations, and evidence readiness.",
    talkTrack: "This is where the story shifts from product narrative to operational control. Show what belongs in dashboards and what does not."
  },
  {
    time: "02:30",
    title: "Open the live work surface",
    route: "/review/command-centre",
    action: "Move into the command centre or workspace to show that the product is a working application, not a static pitch surface.",
    talkTrack: "The workflow exists behind the public pages: route state, JSON persistence, protected APIs, and operating dashboards are already live."
  },
  {
    time: "04:00",
    title: "Show one reviewer decision",
    route: "/review",
    action: "Open the clinical queue and one case so you can explain how blockers, checklist confirmation, and reviewer action flow actually work.",
    talkTrack: "This is the core workflow wedge: structured draft plus clinician-controlled decisioning instead of black-box output."
  },
  {
    time: "05:30",
    title: "Show one frozen artifact",
    route: "/cases/case-005/evidence",
    action: "Open an accepted synthetic case and show finalization, validation, and FHIR-shaped export evidence.",
    talkTrack: "The output is inspectable: final draft, reviewer decision, safety state, source trace, and export quality."
  },
  {
    time: "07:00",
    title: "Close on evidence readiness",
    route: "/review/readiness",
    action: "Show readiness gate, benchmark context, and the honest synthetic-only boundary.",
    talkTrack: "The next milestone is credibility and controlled pilot preparation, not premature live integration."
  }
];

const proofPoints = [
  "The product has working routes, APIs, persistence, tests, and production build gates.",
  "Clinical risk is visible through blockers, warnings, finalization states, and reviewer checklists.",
  "Accepted cases preserve frozen artifacts instead of mutable demo output.",
  "Benchmark and readiness views make proof quality inspectable for advisors and partners.",
  "External integrations are gated off by default so the product stays honest about proof-stage boundaries."
];

const productQuestions = [
  {
    question: "Is this just a prototype?",
    answer: "No. It is a working synthetic proof platform. The limitation is production readiness, not workflow existence."
  },
  {
    question: "Can it handle real NHS data today?",
    answer: "Not yet. The current build intentionally stays synthetic and own-system-first while safety, governance, and interface contracts mature."
  },
  {
    question: "What is the wedge?",
    answer: "Review-first clinical AI: convert consultation input into structured drafts, safety-ranked review, and evidence-ready outputs."
  },
  {
    question: "What gets built next?",
    answer: "Maintainability, clearer product state labels, stronger evidence dossiers, database boundary, own-system contracts, and disabled-adapter contract tests."
  }
];

const demoRules = {
  useThisPageFor: [
    "A founder, partner, or advisor walkthrough where the product needs a controlled sequence.",
    "Showing which page to open next without improvising the story live.",
    "Keeping external-facing product review inside the current proof boundary."
  ],
  doNotUseThisPageFor: [
    "Explaining every internal dashboard in detail.",
    "Replacing the landing page as product positioning copy.",
    "Claiming live NHS integration, production clinical deployment, or real-world evidence readiness."
  ]
};

export function ProductDemoScript() {
  return (
    <main className="product-page product-page--demo">
      <div className="product-sky" aria-hidden="true" />
      <PublicProductNav ctaHref="/review/presenter?demo=1" ctaLabel="Presenter guide" />

      <section className="product-simple-hero">
        <p className="product-kicker">Controlled demo walkthrough</p>
        <h1>Use this page to run the story in the right order.</h1>
        <p>
          The landing page explains the product. Dashboards route operators. This page is the controlled external
          walkthrough that stitches those surfaces together into one professional demo path.
        </p>
      </section>

      <section className="product-section product-rule-grid">
        <article className="product-rule-card">
          <p className="product-kicker">Use this page for</p>
          <ul className="product-bullet-list">
            {demoRules.useThisPageFor.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article className="product-rule-card product-rule-card--accent">
          <p className="product-kicker">Do not use this page for</p>
          <ul className="product-bullet-list">
            {demoRules.doNotUseThisPageFor.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="demo-script-layout">
        <div className="demo-script-main">
          {demoStops.map((stop) => (
            <article className="demo-stop" key={stop.title}>
              <div className="demo-stop__time">{stop.time}</div>
              <div className="demo-stop__body">
                <div className="demo-stop__head">
                  <div>
                    <p className="product-card-label">{stop.title}</p>
                    <h2>{stop.action}</h2>
                  </div>
                  <Link className="product-button product-button--secondary" href={stop.route}>
                    Open
                  </Link>
                </div>
                <p>{stop.talkTrack}</p>
              </div>
            </article>
          ))}
        </div>

        <aside className="demo-script-aside">
          <section className="demo-script-panel">
            <p className="product-kicker">Proof points</p>
            {proofPoints.map((point) => (
              <div className="onboarding-check" key={point}>
                <span aria-hidden="true">OK</span>
                <p>{point}</p>
              </div>
            ))}
          </section>

          <section className="demo-script-panel">
            <p className="product-kicker">Likely questions</p>
            {productQuestions.map((item) => (
              <article className="product-question" key={item.question}>
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </article>
            ))}
          </section>

          <section className="demo-script-panel">
            <p className="product-kicker">Presenter shortcuts</p>
            <div className="actions">
              <Link className="product-button product-button--secondary" href="/dashboards">
                Open dashboards
              </Link>
              <Link className="product-button product-button--secondary" href="/review/command-centre">
                Open command centre
              </Link>
              <Link className="product-button product-button--secondary" href="/review/readiness">
                Open readiness
              </Link>
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
