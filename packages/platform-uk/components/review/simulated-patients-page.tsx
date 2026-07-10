"use client";

import Link from "next/link";

import { getSimulatedPatientCohortSummary, simulatedPatientProfiles } from "@/lib/simulated-patients";

function riskTone(risk: string) {
  if (risk === "high") return "danger";
  if (risk === "moderate") return "warn";
  return "ok";
}

export function SimulatedPatientsPage() {
  const summary = getSimulatedPatientCohortSummary();

  return (
    <div className="grid">
      <section className="span-12 hero-banner stack">
        <span className="hero-kicker">Simulated patient cohort</span>
        <div className="actions">
          <Link className="button secondary" href="/review">
            Review queue
          </Link>
          <Link className="button secondary" href="/review/governance-pack">
            Governance pack
          </Link>
          <Link className="button secondary" href="/review/demo-readiness?demo=1">
            Demo readiness
          </Link>
        </div>
        <h2>Richer fake patient profiles for testing the Aksh Health own-system workflow.</h2>
        <p>
          These profiles are deliberately simulated. They give the product realistic longitudinal context without using
          real patient data or implying NHS/EHR integration.
        </p>
        <div className="hero-stats">
          <div className="hero-stat">
            <strong>Profiles</strong>
            <p>Synthetic people linked to current seeded review scenarios.</p>
            <span className="hero-stat-value">{summary.totalProfiles}</span>
          </div>
          <div className="hero-stat">
            <strong>Linked cases</strong>
            <p>Review cases covered by simulated profiles.</p>
            <span className="hero-stat-value">{summary.linkedReviewCases}</span>
          </div>
          <div className="hero-stat">
            <strong>Real patient data</strong>
            <p>No real patient records, demographics, or NHS identifiers are used.</p>
            <span className="hero-stat-value">0</span>
          </div>
        </div>
      </section>

      <section className="span-12 panel stack">
        <div className="row">
          <div>
            <h3>Cohort Mix</h3>
            <p>Designed to cover clean review, missing data, medication risk, respiratory escalation, and governance cases.</p>
          </div>
          <span className="pill">synthetic only</span>
        </div>
        <div className="grid">
          <div className="metric">
            <span className="meta">Low risk</span>
            <strong>{summary.riskMix.low}</strong>
          </div>
          <div className="metric">
            <span className="meta">Moderate risk</span>
            <strong>{summary.riskMix.moderate}</strong>
          </div>
          <div className="metric alert">
            <span className="meta">High risk</span>
            <strong>{summary.riskMix.high}</strong>
          </div>
        </div>
      </section>

      {simulatedPatientProfiles.map((profile) => (
        <article className="span-6 panel stack" key={profile.id}>
          <div className="row">
            <div>
              <h3>{profile.displayName}</h3>
              <p>
                {profile.ageBand} · {profile.sex.replaceAll("_", " ")} · {profile.locality}
              </p>
            </div>
            <span className={`tag ${riskTone(profile.riskProfile)}`}>{profile.riskProfile}</span>
          </div>
          <p>{profile.longitudinalSummary}</p>
          <div className="list">
            <div className="row">
              <div>
                <strong>Scenario class</strong>
                <p>{profile.scenarioClass}</p>
              </div>
            </div>
            <div className="row">
              <div>
                <strong>Active problems</strong>
                <p>{profile.activeProblems.join(", ") || "None recorded"}</p>
              </div>
            </div>
            <div className="row">
              <div>
                <strong>Medicines and allergies</strong>
                <p>
                  Medicines: {profile.medications.join(", ") || "None"}; allergies: {profile.allergies.join(", ") || "None"}.
                </p>
              </div>
            </div>
            <div className="row">
              <div>
                <strong>Recent observations</strong>
                <p>{profile.recentObservations.join(", ")}</p>
              </div>
            </div>
          </div>
          <div className="actions">
            {profile.linkedCaseIds.map((caseId) => (
              <Link className="button secondary" href={`/cases/${caseId}`} key={caseId}>
                {caseId}
              </Link>
            ))}
          </div>
          <p className="meta">Synthetic-only profile. Not derived from or linkable to a real patient.</p>
        </article>
      ))}
    </div>
  );
}
