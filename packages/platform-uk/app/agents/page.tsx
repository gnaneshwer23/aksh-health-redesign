import type { Metadata } from "next";
import Link from "next/link";

import { AgentLineFigure } from "@/components/site/AgentLineFigure";
import { AGENT_FACTS, PUBLIC_AGENTS, STAGES } from "@/components/site/agents-content";
import { PilotCta } from "@/components/site/PageParts";
import { SiteShell } from "@/components/site/SiteShell";
import { StatusPill } from "@/components/site/StatusPill";
import { AGENTS } from "@/lib/agents/register";
import { HUMAN_GATES } from "@/components/site/vision";

export const metadata: Metadata = {
  title: "Clinical AI agents",
  description:
    "Fourteen specialised AI agents work as one supervised review line. They draft, check and organise; a named clinician accepts, edits or rejects every output. In validation on synthetic patients.",
};

const TECH = [
  {
    title: "Language models, gated per agent",
    body: "Drafting agents can call a large language model to write notes, briefs and correlations. Each one is switched on individually, only in the validation environment and only on synthetic patients. In production no patient data is sent to any AI model; agents fall back to rules.",
  },
  {
    title: "A versioned rule engine",
    body: `Clinical thresholds such as kidney function categories, CGM time-in-range targets and lipid levels live in one registry of ${AGENT_FACTS.registeredRules} rules, each with its published source, version and sign-off state. Every flag cites the rule that raised it.`,
  },
  {
    title: "A clinical knowledge graph",
    body: "Medication interactions and risk factors come from a graph of conditions, medicines and relationships. When the graph is not available, the agent says so and labels its stand-in data.",
  },
  {
    title: "Health data standards",
    body: "Laboratory results arrive as FHIR R4 Observations with LOINC codes and are converted to one set of units (UCUM). Coding suggestions use SNOMED CT and ICD-10. Accepted work is packaged as FHIR R4.",
  },
  {
    title: "Provenance on every value",
    body: "Each value says what it is: measured, patient-reported, calculated, an AI draft, or confirmed by a clinician. An AI draft is never shown as a measurement.",
  },
  {
    title: "Tamper-evident audit and measured performance",
    body: "Every run and decision is recorded in an append-only, hash-chained log. How often clinicians accept, edit or reject each agent's drafts is measured, and those figures decide whether an agent can be released.",
  },
];

const pct = (n?: number) => (n === undefined ? "—" : `${Math.round(n * 100)}%`);

export default function AgentsPage() {
  const releaseRows = AGENTS.filter((a) => a.release?.minDecided);
  return (
    <SiteShell>
      <section className="s-page-head">
        <div className="s-container s-page-head__inner">
          <h1 className="s-h1" style={{ fontSize: "clamp(36px, 4.6vw, 58px)", maxWidth: 900 }}>
            Fourteen specialised agents. <span className="s-grad">A clinician makes every decision.</span>
          </h1>
          <p className="s-lede">
            Aksh&apos;s clinical AI works as one supervised review line. Agents capture, draft, check and organise the work;
            a named clinician accepts, edits or rejects every output, and nothing reaches a record without that decision.
          </p>
          <p className="s-small" style={{ maxWidth: 720 }}>
            <StatusPill s="in_validation" /> The agents are in validation on synthetic patients. They are not used for real
            patients until each one meets its release criteria and your clinical safety officer signs it off.
          </p>
          <div className="s-figures" aria-label="Key figures">
            <div><b>{AGENT_FACTS.agents}</b><span>specialised agents under one supervisor</span></div>
            <div><b>{AGENT_FACTS.humanGates}</b><span>decisions that always need a named person</span></div>
            <div><b>{AGENT_FACTS.registeredRules}</b><span>clinical rules, each with its source</span></div>
            <div><b>0</b><span>patient records sent to AI models in production</span></div>
          </div>
        </div>
      </section>

      <section className="s-section s-section--tight" id="line">
        <div className="s-container">
          <h2 className="s-h2" style={{ maxWidth: 760 }}>The review line</h2>
          <p className="s-lede" style={{ marginBottom: 28 }}>
            Patient data enters on the left. Four agents work on it in parallel, then everything stops at the clinician.
            Only what the clinician accepts moves on.
          </p>
          <AgentLineFigure />
        </div>
      </section>

      <section className="s-section" id="agents">
        <div className="s-container">
          <h2 className="s-h2" style={{ maxWidth: 760 }}>Every agent, and who decides</h2>
          <p className="s-lede" style={{ marginBottom: 12 }}>
            Each agent has one job, a defined input and output, a list of things it must never do, and a person who
            reviews its work.
          </p>
          {STAGES.map((st) => {
            const rows = PUBLIC_AGENTS.filter((a) => a.stage === st.key);
            if (st.key === "decide") {
              return (
                <div key={st.key} className="s-agents-stage" data-stage={st.key}>
                  <div><h3>{st.title}</h3><p>{st.detail}</p></div>
                  <div>
                    {HUMAN_GATES.map((g) => (
                      <div key={g.gate} className="s-agent-row" style={{ gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 2fr)" }}>
                        <b>{g.gate}</b>
                        <span><p>{g.who}</p></span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            return (
              <div key={st.key} className="s-agents-stage" data-stage={st.key}>
                <div><h3>{st.title}</h3><p>{st.detail}</p></div>
                <div>
                  {rows.map((a) => (
                    <div key={a.id} className="s-agent-row" data-agent={a.id}>
                      <b>{a.name}</b>
                      <span>
                        <p>{a.role}</p>
                        <small>{a.handsOver}</small>
                        {a.usesModel ? <span className="s-model">Can use a language model in validation, on synthetic data only</span> : null}
                      </span>
                      <StatusPill s={a.status} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="s-section s-section--soft" id="technology">
        <div className="s-container">
          <h2 className="s-h2" style={{ maxWidth: 760 }}>The technology underneath</h2>
          <p className="s-lede" style={{ marginBottom: 28 }}>
            Advanced where it helps, conservative where it matters: models draft, rules decide what is flagged, and people
            decide what happens.
          </p>
          <div className="s-tech">
            {TECH.map((t) => (
              <div key={t.title}><h3>{t.title}</h3><p>{t.body}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="s-section" id="release">
        <div className="s-container">
          <h2 className="s-h2" style={{ maxWidth: 760 }}>How an agent earns release</h2>
          <p className="s-lede" style={{ marginBottom: 24 }}>
            Release is measured, not assumed. Each drafting agent has targets on what clinicians did with its drafts in
            validation, and every agent needs a signed clinical safety case, a data protection impact assessment and your
            approval to go live. The targets below are proposed and are confirmed by your clinical safety officer.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table className="s-release">
              <thead>
                <tr><th>Agent</th><th>Decided drafts</th><th>Rejected</th><th>Accepted without edits</th><th>Referrals confirmed</th></tr>
              </thead>
              <tbody>
                {releaseRows.map((a) => (
                  <tr key={a.id}>
                    <td>{a.productName.replace(/ \(part of .*\)$/, "")}</td>
                    <td>at least {a.release!.minDecided}</td>
                    <td>{a.release!.maxRejectionRate !== undefined ? `at most ${pct(a.release!.maxRejectionRate)}` : "—"}</td>
                    <td>{a.release!.minAcceptedUneditedRate !== undefined ? `at least ${pct(a.release!.minAcceptedUneditedRate)}` : "—"}</td>
                    <td>{a.release!.minConfirmationRate !== undefined ? `at least ${pct(a.release!.minConfirmationRate)}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="s-small" style={{ marginTop: 16 }}>
            What is available to clinics today is listed on <Link href="/product" className="s-link">Available now</Link>; how
            data is protected is on <Link href="/security" className="s-link">Security</Link>.
          </p>
        </div>
      </section>

      <PilotCta title="See the agents on your own synthetic cases." body="We will walk your clinical lead through the review line, the gates and the release criteria, then scope a pilot." secondary={{ href: "/platform", label: "How it works" }} />
    </SiteShell>
  );
}
