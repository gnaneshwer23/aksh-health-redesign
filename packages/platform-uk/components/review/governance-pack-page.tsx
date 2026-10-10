"use client";

import Link from "next/link";
import { useMemo } from "react";

import { buildGovernancePack, type GovernancePack } from "@/lib/governance-pack";
import { getClinicalSafetyFilePlaceholders } from "@/lib/clinical-safety-files";
import { buildRolePermissionMatrix } from "@/lib/permission-matrix";
import { buildDatabaseAdapterContract, getDatabaseBoundaryPlan, getOwnSystemInterfaceContracts } from "@/lib/system-contracts";
import { useReviewCases } from "@/lib/use-review-cases";

function hazardTone(severity: string) {
  if (severity === "high") return "danger";
  if (severity === "medium") return "warn";
  return "ok";
}

export function GovernancePackPage() {
  const { cases, isLoaded, error } = useReviewCases();
  const pack: GovernancePack = useMemo(() => buildGovernancePack(cases), [cases]);
  const ownSystemContracts = useMemo(() => getOwnSystemInterfaceContracts(), []);
  const databaseBoundary = useMemo(() => getDatabaseBoundaryPlan(), []);
  const databaseAdapterContract = useMemo(() => buildDatabaseAdapterContract(), []);
  const permissionMatrix = useMemo(() => buildRolePermissionMatrix(), []);
  const clinicalSafetyFiles = useMemo(() => getClinicalSafetyFilePlaceholders(), []);

  if (!isLoaded) {
    return <div className="panel">Loading governance pack...</div>;
  }

  if (error) {
    return <div className="panel">{error}</div>;
  }

  return (
    <div className="layout-grid">
      <section className="span-12 hero-banner stack">
        <span className="hero-kicker">Clinical safety governance pack</span>
        <div className="actions">
          <Link className="button secondary" href="/review/simulated-patients">
            Simulated patients
          </Link>
          <Link className="button secondary" href="/review/readiness">
            Evidence readiness
          </Link>
          <Link className="button secondary" href="/review/benchmarks/report">
            Benchmark report
          </Link>
          <a className="button secondary" href="/api/research/evaluation">
            Export research boundary
          </a>
          <a className="button secondary" href="/api/system/database-contract">
            Export database contract
          </a>
          <a className="button secondary" href="/api/system/permission-matrix">
            Export permission matrix
          </a>
          <a className="button secondary" href="/api/system/audit-integrity">
            Export audit integrity
          </a>
          <a className="button secondary" href="/api/system/clinical-safety-files">
            Export safety file map
          </a>
          <a className="button secondary" href="/api/system/integration-contract">
            Export integration contract
          </a>
        </div>
        <h2>Production-readiness safety structure without pretending production sign-off.</h2>
        <p>
          This pack turns current synthetic review behavior into a safety-case rehearsal: hazards, controls, evidence,
          and readiness gaps for Aksh Health's own-system clinical workflow.
        </p>
        <div className="hero-stats">
          <div className="hero-stat">
            <strong>Production safety case</strong>
            <p>Not signed off. This is a structured rehearsal pack.</p>
            <span className="hero-stat-value">{pack.productionClinicalSafetyCase ? "signed" : "not yet"}</span>
          </div>
          <div className="hero-stat">
            <strong>Hazards</strong>
            <p>Known synthetic-proof hazards and required controls.</p>
            <span className="hero-stat-value">{pack.summary.hazards}</span>
          </div>
          <div className="hero-stat">
            <strong>Benchmark pass rate</strong>
            <p>Current synthetic benchmark performance.</p>
            <span className="hero-stat-value">{pack.summary.benchmarkPassRate}%</span>
          </div>
        </div>
      </section>

      <section className="span-12 panel stack">
        <div className="row">
          <div>
            <h3>Safety Case Sections</h3>
            <p>What a production safety file would need to contain before real clinical deployment.</p>
          </div>
          <span className="tag warn">rehearsal</span>
        </div>
        <div className="layout-grid">
          {pack.safetyCaseSections.map((section) => (
            <div className="metric" key={section}>
              <span className="meta">Section</span>
              <strong>{section}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="span-12 panel stack">
        <div className="row">
          <div>
            <h3>Hazard Log Rehearsal</h3>
            <p>Initial hazard structure derived from current workflow rules and proof boundaries.</p>
          </div>
          <span className="pill">{pack.summary.hazardsNeedingOwner} need owner</span>
        </div>
        <div className="list">
          {pack.hazards.map((hazard) => (
            <div className="row" key={hazard.id}>
              <div>
                <strong>{hazard.title}</strong>
                <p>{hazard.evidence}</p>
                <p>Control needed: {hazard.requiredControl}</p>
              </div>
              <div className="actions">
                <span className={`tag ${hazardTone(hazard.severity)}`}>{hazard.severity}</span>
                <span className={`tag ${hazard.status === "controlled_in_synthetic_proof" ? "ok" : "warn"}`}>
                  {hazard.status.replaceAll("_", " ")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="span-6 panel stack">
        <h3>Current Assurance Summary</h3>
        <div className="list">
          <div className="row">
            <div>
              <strong>{pack.summary.totalCases} synthetic case(s)</strong>
              <p>{pack.summary.blockedCases} currently blocked; {pack.summary.highImpactClinicalRules} high-impact clinical rule result(s).</p>
            </div>
          </div>
          <div className="row">
            <div>
              <strong>{pack.summary.averageValidationScore} average validation score</strong>
              <p>{pack.summary.strongDossiers} strong dossier(s), {pack.summary.incompleteDossiers} incomplete dossier(s).</p>
            </div>
          </div>
        </div>
      </section>

      <section className="span-6 panel stack">
        <h3>Production Readiness Gaps</h3>
        <div className="list">
          {pack.productionReadinessGaps.map((gap) => (
            <div className="row" key={gap}>
              <div>
                <strong>{gap}</strong>
                <p>Required before any production clinical safety claim.</p>
              </div>
              <span className="tag danger">not yet</span>
            </div>
          ))}
        </div>
      </section>

      <section className="span-6 panel stack">
        <h3>Own-System Interface Contracts</h3>
        <div className="list">
          {ownSystemContracts.map((contract) => (
            <div className="row" key={contract.id}>
              <div>
                <strong>{contract.label}</strong>
                <p>{contract.boundary}</p>
              </div>
              <span className={`tag ${contract.status === "available" ? "ok" : contract.status === "disabled" ? "danger" : "warn"}`}>
                {contract.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="span-6 panel stack">
        <h3>Database Boundary Plan</h3>
        <div className="actions">
          <a className="button secondary" href="/api/system/database-contract">
            Export Database JSON
          </a>
        </div>
        <div className="list">
          <div className="row">
            <div>
              <strong>{databaseAdapterContract.activeAdapter}</strong>
              <p>Active repository adapter (default json_file_repository via AKSH_STORAGE_ADAPTER).</p>
            </div>
            <span className="tag ok">active</span>
          </div>
          <div className="row">
            <div>
              <strong>{databaseBoundary.currentAdapter}</strong>
              <p>Current source of truth: {databaseBoundary.defaultSourceOfTruth}.</p>
            </div>
            <span className="tag warn">{databaseBoundary.currentStatus.replaceAll("_", " ")}</span>
          </div>
          <div className="row">
            <div>
              <strong>{databaseAdapterContract.migrationStatus.replaceAll("_", " ")}</strong>
              <p>Active adapter: {databaseAdapterContract.activeAdapter}; production database configured: no.</p>
            </div>
            <span className="tag ok">json active</span>
          </div>
          {databaseBoundary.migrationPrinciples.slice(0, 3).map((item) => (
            <div className="row" key={item}>
              <div>
                <strong>{item}</strong>
                <p>Required for a safe future database adapter.</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="span-6 panel stack">
        <h3>Role And Action Permission Matrix</h3>
        <p className="meta">Rehearsal matrix for clinical reviewer vs operations lead boundaries. Not production RBAC enforcement yet.</p>
        <div className="list">
          {permissionMatrix.matrix.slice(0, 6).map((entry) => (
            <div className="row" key={entry.actionId}>
              <div>
                <strong>{entry.label}</strong>
                <p>
                  Clinical reviewer: {entry.clinical_reviewer}; operations lead: {entry.operations_lead}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="span-6 panel stack">
        <h3>Audit Integrity Checks</h3>
        <p className="meta">Synthetic proof audit trail checks for accepted cases, frozen artifacts, and reviewer decision evidence.</p>
        <div className="actions">
          <a className="button secondary" href="/api/system/audit-integrity">
            Export audit report
          </a>
        </div>
        <div className="list">
          <div className="row">
            <div>
              <strong>CLI check</strong>
              <p>Run npm run data:audit-integrity before advisor handoff or after storage changes.</p>
            </div>
            <span className="tag warn">manual</span>
          </div>
        </div>
      </section>

      <section className="span-12 panel stack">
        <div className="row">
          <div>
            <h3>Clinical Safety File Placeholders</h3>
            <p>In-app placeholders and export links only. Not signed clinical safety deliverables.</p>
          </div>
          <span className="tag danger">not signed off</span>
        </div>
        <div className="list">
          {clinicalSafetyFiles.map((file) => (
            <div className="row" key={file.id}>
              <div>
                <strong>{file.title}</strong>
                <p>{file.purpose}</p>
                <p>
                  Owner: {file.owner}. Next step: {file.nextStep}
                </p>
              </div>
              <div className="actions">
                <span className={`tag ${file.status === "draft_in_app" ? "warn" : file.status === "placeholder" ? "warn" : "danger"}`}>
                  {file.status.replaceAll("_", " ")}
                </span>
                <Link className="button secondary" href={file.inAppRoute}>
                  Open
                </Link>
                {file.exportRoute ? (
                  <a className="button secondary" href={file.exportRoute}>
                    Export
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="span-12 panel stack">
        <div className="row">
          <div>
            <h3>ML / Research Evaluation Boundary</h3>
            <p>{pack.researchEvaluation.inspiredBy}; offline only, synthetic only, and not part of live clinical decisioning.</p>
          </div>
          <span className="tag warn">research rehearsal</span>
        </div>
        <div className="actions">
          <a className="button secondary" href="/api/research/evaluation">
            Export Research JSON
          </a>
        </div>
        <div className="layout-grid">
          {pack.researchEvaluation.tasks.map((task) => (
            <div className="span-6 panel stack" key={task.id}>
              <div className="row">
                <div>
                  <strong>{task.label}</strong>
                  <p>{task.datasetBoundary}</p>
                </div>
                <span className={`tag ${task.stage === "available_now" ? "ok" : task.stage === "not_allowed_yet" ? "danger" : "warn"}`}>
                  {task.stage.replaceAll("_", " ")}
                </span>
              </div>
              <p className="meta">Metric: {task.targetMetric}</p>
              <p className="meta">Production clinical AI claim allowed: no</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
