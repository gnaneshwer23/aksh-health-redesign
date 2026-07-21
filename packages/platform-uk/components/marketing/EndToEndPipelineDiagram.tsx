import { cn } from "@/lib/utils";

import styles from "./EndToEndPipelineDiagram.module.css";

type PhaseBadge = "live" | "phase2" | "staging" | "roadmap";

function Phase({ kind, children }: { kind: PhaseBadge; children: string }) {
  return (
    <span
      className={cn(
        styles.badge,
        kind === "live" && styles.badgeLive,
        kind === "phase2" && styles.badgePhase2,
        kind === "staging" && styles.badgeStaging,
        kind === "roadmap" && styles.badgeRoadmap
      )}
    >
      {children}
    </span>
  );
}

/**
 * End-to-end 12-agent pipeline diagram for /how-it-works.
 * Honesty: LIVE only for capabilities that run in-product; EHR write-back,
 * Mirth, PRISM, ATLAS, and hospital EPRs stay PHASE 2 / STAGING / ROADMAP.
 * CONDUCTOR is the clinical-spine orchestrator — not LangGraph.
 * ORACLE is labelled HORIZON.
 */
export function EndToEndPipelineDiagram({ className }: { className?: string }) {
  return (
    <div className={cn(styles.wrap, className)}>
      <div className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-emerald">End-to-end pipeline</p>
        <h2 className="mt-2 font-[family-name:var(--font-marketing-display)] text-2xl font-bold tracking-tight text-navy md:text-3xl">
          How it works — capture to governed record
        </h2>
        <p className={styles.subtitle}>
          Capture → Draft → Approve · 12 agents · One governed pipeline · Zero auto-writes
        </p>
      </div>

      <div className={styles.diagram} role="img" aria-label="Aksh Health end-to-end agent pipeline diagram">
        {/* Column 1 */}
        <div className={styles.col}>
          <div className={cn(styles.colHeader, styles.colSources)}>① Data sources</div>

          <div className={styles.ehrCard}>
            <div className={styles.ehrTitle}>EHR targets (not live feeds)</div>
            <div className={styles.ehrItem}>
              <span className={styles.ehrDot} aria-hidden />
              EMIS Web — partner staging path
            </div>
            <div className={styles.ehrItem}>
              <span className={styles.ehrDot} aria-hidden />
              SystmOne — partner staging path
            </div>
            <div className={styles.ehrItem}>
              <span className={cn(styles.ehrDot, styles.ehrDotMuted)} aria-hidden />
              Epic / Oracle Health — roadmap
            </div>
          </div>

          <div className={cn(styles.card, styles.canvas)}>
            <Phase kind="live">LIVE</Phase>
            <div className={styles.cardName}>CANVAS</div>
            <p className={styles.cardDesc}>
              Clinical Intake Agent
              <br />
              Structures patient history, conditions, medications, and encounters from synthetic or staged context
              before review.
            </p>
            <span className={styles.cardFhir}>Patient · Encounter · Condition</span>
          </div>

          <div className={styles.feedBox}>
            <strong>Also feeds into CANVAS</strong>
            <div className={styles.feedList}>
              • Lab results (Observation)
              <br />
              • Imaging reports (roadmap / PRISM)
              <br />
              • Appointment reason
              <br />
              • Allergy &amp; alert records
              <br />• Wearables (Phase 2)
            </div>
          </div>
        </div>

        <div className={styles.arrowCol} aria-hidden>
          <div className={styles.arrow}>→</div>
          <div className={styles.arrowHint}>
            FHIR R4
            <br />
            intake
          </div>
        </div>

        {/* Column 2 */}
        <div className={styles.col}>
          <div className={cn(styles.colHeader, styles.colIntel)}>② Intelligence layer</div>

          <div className={cn(styles.card, styles.bridge)}>
            <Phase kind="live">LIVE</Phase>
            <div className={styles.cardName}>BRIDGE</div>
            <p className={styles.cardDesc}>
              Interoperability Agent
              <br />
              Maps clinical drafts to HL7 FHIR R4 shapes and manages staging after clinician approval. Not a live EMIS
              pull today.
            </p>
            <span className={styles.cardFhir}>Bundle · MessageHeader</span>
          </div>

          <div className={styles.neoBox}>
            <div className={styles.neoTitle}>Neo4j knowledge graph</div>
            <p className={styles.neoDesc}>
              Patients linked to conditions, medications, risk factors, and interactions when Neo4j is configured.
              Falls back to local synthetic data otherwise. CONDUCTOR uses this graph for agent context.
            </p>
            <div className={styles.chipRow}>
              <span className={styles.chip}>Patient nodes</span>
              <span className={styles.chip}>Condition links</span>
              <span className={styles.chip}>INTERACTS_WITH</span>
              <span className={styles.chip}>Risk traversal</span>
            </div>
            <span className={cn(styles.inlineBadge, styles.badgeLive)} style={{ position: "static", marginTop: 8 }}>
              LIVE when configured
            </span>
          </div>

          <div className={cn(styles.card, styles.nexus)}>
            <Phase kind="live">LIVE · in CONDUCTOR</Phase>
            <div className={styles.cardName}>NEXUS</div>
            <p className={styles.cardDesc}>
              Clinical Intelligence Agent
              <br />
              Correlates labs, medications, and graph signals into draft clinical impressions via AI Gateway (with
              deterministic fallback). Included in the default CONDUCTOR path after SYNTHESIS→GUARDIAN→HORIZON —
              always <code>status: draft</code>, HITL Accept/Edit/Reject, SHIELD-audited, no live EMR write.
            </p>
            <span className={styles.cardFhir}>ClinicalImpression · DiagnosticReport</span>
          </div>

          <div className={cn(styles.card, styles.prism)}>
            <Phase kind="phase2">PHASE 2</Phase>
            <div className={styles.cardName}>PRISM</div>
            <p className={styles.cardDesc}>
              Imaging Intelligence Agent
              <br />
              Roadmap: radiology / DICOM → structured FHIR. Not built in the current product.
            </p>
            <span className={styles.cardFhir}>ImagingStudy · Observation</span>
          </div>
        </div>

        <div className={styles.arrowCol} aria-hidden>
          <div className={styles.arrow}>→</div>
          <div className={styles.arrowHint}>
            Agents
            <br />
            draft in
            <br />
            parallel
          </div>
        </div>

        {/* Column 3 */}
        <div className={styles.col}>
          <div className={cn(styles.colHeader, styles.colAgents)}>③ AI agents (parallel)</div>

          <div className={styles.conductorBanner}>
            <div className={styles.conductorTitle}>CONDUCTOR orchestrates all agents</div>
            <p className={styles.conductorDesc}>
              Clinical-spine orchestrator (in-app) — not LangGraph. Chooses agent order per consult type, aggregates
              priority, and enforces the HITL gate before any staging.
            </p>
          </div>

          <div className={cn(styles.card, styles.synthesis)}>
            <Phase kind="live">LIVE</Phase>
            <div className={styles.cardName}>SYNTHESIS</div>
            <p className={styles.cardDesc}>
              Clinical Documentation Agent
              <br />
              Structures voice or typed input into a SOAP note draft via Vercel AI Gateway (with rule-based fallback).
            </p>
            <span className={styles.cardFhir}>DocumentReference (SOAP)</span>
          </div>

          <div className={cn(styles.card, styles.guardian)}>
            <Phase kind="live">LIVE</Phase>
            <div className={styles.cardName}>GUARDIAN</div>
            <p className={styles.cardDesc}>
              Medication Intelligence Agent
              <br />
              Drug-interaction and allergy safety flags. High-severity items sort URGENT in the review queue.
            </p>
            <span className={styles.cardFhir}>Flag · DetectedIssue</span>
          </div>

          <div className={cn(styles.card, styles.horizon)}>
            <Phase kind="live">LIVE</Phase>
            <div className={styles.cardName}>HORIZON</div>
            <p className={styles.cardDesc}>
              Predictive Risk Agent
              <br />
              CVD / long-term-condition risk stratification (formerly ORACLE). Graph-backed when Neo4j is live; draft
              only until clinician Accept.
            </p>
            <span className={styles.cardFhir}>RiskAssessment</span>
          </div>

          <div className={cn(styles.card, styles.pathway)}>
            <Phase kind="live">LIVE</Phase>
            <div className={styles.cardName}>PATHWAY</div>
            <p className={styles.cardDesc}>
              Care Coordination Agent
              <br />
              Referral packages, pathway enrolment, and follow-up tasks as drafts for clinician sign-off.
            </p>
            <span className={styles.cardFhir}>ServiceRequest · CarePlan · Task</span>
          </div>
        </div>

        <div className={styles.arrowCol} aria-hidden>
          <div className={styles.arrow}>→</div>
          <div className={cn(styles.arrowHint, styles.arrowHintHitl)}>
            HITL
            <br />
            gate
          </div>
        </div>

        {/* Column 4 */}
        <div className={styles.col}>
          <div className={cn(styles.colHeader, styles.colReview)}>④ Clinician review → record</div>

          <div className={styles.hitlBox}>
            <div className={styles.hitlTitle}>
              <span aria-hidden>🛡</span> Review queue — the HITL gate
            </div>
            <p className={styles.hitlBody}>
              Every agent output lands here as <strong>DRAFT</strong>.
              <br />
              Sorted: URGENT → HIGH → NORMAL.
              <br />
              Each item shows agent · confidence · evidence · “Draft — not yet in record”.
            </p>
            <div className={styles.hitlActions}>
              <span className={cn(styles.hitlBtn, styles.btnAccept)}>✓ Accept</span>
              <span className={cn(styles.hitlBtn, styles.btnEdit)}>✎ Edit</span>
              <span className={cn(styles.hitlBtn, styles.btnReject)}>✕ Reject</span>
            </div>
            <p className={styles.hitlRule}>
              <strong>Zero auto-writes.</strong> The queue waits until the clinician decides. No timer. No bulk
              approve. No bypass.
            </p>
          </div>

          <div className={cn(styles.card, styles.shield)}>
            <Phase kind="live">LIVE</Phase>
            <div className={styles.cardName}>SHIELD</div>
            <p className={styles.cardDesc}>
              Regulatory &amp; Audit Agent
              <br />
              Immutable audit events on every action. Runs automatically — not HITL-gated. Supports DCB0129-style
              safety-file rehearsal (not a certification claim).
            </p>
            <span className={styles.cardFhir}>AuditEvent · Provenance · Consent</span>
          </div>

          <div className={styles.fhirBox}>
            <div className={styles.fhirTitle}>FHIR R4 staging</div>
            <p className={styles.fhirDesc}>
              Accepted outputs stage as draft FHIR resources — clinician-attributed, timestamped, status{" "}
              <em>preliminary</em>. Medplum sync is optional and off by default.
            </p>
            <div>
              <span className={styles.fhirChip}>DocumentReference</span>
              <span className={styles.fhirChip}>Condition</span>
              <span className={styles.fhirChip}>RiskAssessment</span>
              <span className={styles.fhirChip}>ServiceRequest</span>
              <span className={styles.fhirChip}>Flag</span>
              <span className={styles.fhirChip}>AuditEvent</span>
            </div>
            <span className={cn(styles.inlineBadge, styles.badgeStaging)} style={{ position: "static", marginTop: 8 }}>
              STAGING / SIM
            </span>
          </div>

          <div className={styles.writeBack}>
            <div className={styles.writeBackTitle}>EHR write-back</div>
            <p className={styles.writeBackDesc}>
              Partner path: after confirmation, staged FHIR may move toward EMIS Web or SystmOne. Today the product
              runs <strong>ehr-writeback-sim</strong> and emis-staging only — <strong>liveEmis: false</strong>. Mirth
              Connect is roadmap.
            </p>
            <div className={styles.writeBackNote}>PHASE 2 / ROADMAP · EMIS Partner Programme required · no live write</div>
          </div>
        </div>
      </div>

      <div className={styles.bottomSection}>
        <div className={styles.bottomLabel}>Population, research &amp; governance agents</div>
        <div className={styles.bottomGrid}>
          <div className={cn(styles.bottomCard, styles.compassBorder)}>
            <div className={cn(styles.bottomCardName, styles.compassName)}>COMPASS — Population Health</div>
            <p className={styles.bottomCardRole}>
              Aggregates risk and equity signals across the ICS footprint for the ICS dashboard. No patient-level spill
              to ICS users.
            </p>
            <div className={styles.bottomCardFhir}>Observation · MeasureReport · Group</div>
            <span className={cn(styles.inlineBadge, styles.compassBadge)}>LIVE — ICS dashboard</span>
          </div>

          <div className={cn(styles.bottomCard, styles.atlasBorder)}>
            <div className={cn(styles.bottomCardName, styles.atlasName)}>ATLAS — Clinical Research</div>
            <p className={styles.bottomCardRole}>
              Roadmap: trial eligibility, biomarker discovery, federated analytics. Not built in the current product.
            </p>
            <div className={styles.bottomCardFhir}>ResearchStudy · ResearchSubject · Consent</div>
            <span className={cn(styles.inlineBadge, styles.atlasBadge)}>PHASE 2 — Roadmap</span>
          </div>

          <div className={cn(styles.bottomCard, styles.shieldBottom)}>
            <div className={cn(styles.bottomCardName, styles.shieldName)}>SHIELD — Regulatory &amp; Audit</div>
            <p className={styles.bottomCardRole}>
              Immutable audit on every agent and clinician action. Exportable for governance review. DCB0129-style
              evidence pack — not MHRA/DCB certification.
            </p>
            <div className={styles.bottomCardFhir}>AuditEvent · Provenance · Consent</div>
            <span className={cn(styles.inlineBadge, styles.shieldBadge)}>LIVE — All dashboards</span>
          </div>

          <div className={cn(styles.bottomCard, styles.conductorBottom)}>
            <div className={cn(styles.bottomCardName, styles.conductorName)}>CONDUCTOR — Supervisor</div>
            <p className={styles.bottomCardRole}>
              Clinical-spine orchestrator. Enforces HITL before FHIR staging and requires a SHIELD audit event. No
              LangGraph dependency in this build.
            </p>
            <div className={styles.bottomCardFhir}>No direct FHIR — orchestration only</div>
            <span className={cn(styles.inlineBadge, styles.conductorBadge)}>LIVE — Clinical spine</span>
          </div>
        </div>
      </div>

      <div className={styles.invariant}>
        <div className={styles.invariantIcon} aria-hidden>
          🛡
        </div>
        <div className={styles.invariantText}>
          <h3>The invariant — enforced at every layer</h3>
          <p>
            Zero AI outputs are written to a live EHR without explicit clinician approval. CONDUCTOR enforces the HITL
            gate in the clinical spine; BRIDGE stages only approved drafts; SHIELD records every action. There is no
            bypass, no timer, and no bulk-approve. Current builds use synthetic demo data and sim/staging write-back
            only.
          </p>
        </div>
      </div>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: "#E8F5F0", border: "1.5px solid #006B4F" }} />
          Phase 1 · Live in product
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: "#EBF4FF", border: "1.5px solid #003D7A" }} />
          Staging / sim
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: "#FEF3E2", border: "1.5px solid #E67E22" }} />
          Phase 2 · Roadmap
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: "#F4ECF7", border: "1.5px solid #6B46C1" }} />
          FHIR R4 resource
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: "#FEF2F2", border: "1.5px solid #E53E3E" }} />
          HITL required
        </div>
        <p className={styles.disclaimer}>
          Aksh Health Ltd · Registered in England &amp; Wales · Pilot-stage synthetic demo · Clinician review required
          on all outputs · No live EMIS/SystmOne write-back in this build
        </p>
      </div>
    </div>
  );
}
