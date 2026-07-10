import type { deriveEvidenceReadinessGate } from "@/lib/data-health";
import type { deriveEvidenceReadinessTrend } from "@/lib/readiness-history-analytics";
import type {
  deriveClinicalRuleCoverageMatrix,
  deriveMeetingOutcomeAnalytics,
  deriveMeetingOutcomeEscalation,
  deriveMeetingOwnerWorkload,
  deriveReviewAnalytics,
  deriveScenarioBenchmark,
  deriveScenarioBenchmarkActionQueue
} from "@/lib/workflow";
import type { BenchmarkSignoffEntry } from "@/lib/benchmark-signoff-types";

import {
  BenchmarkActionQueueSummary,
  BenchmarkSignoffSummary,
  EvidenceReadinessGateCard,
  EvidenceReadinessTrendCard
} from "./quality-summary-cards";

export function ReviewWorkflowSignalsList({
  evidenceReadinessGate,
  evidenceReadinessTrend,
  includeReadinessCards = false,
  readinessHistoryLoaded,
  reviewAnalytics,
  blockerDetail = "Most common blocker category in the active workflow.",
  includeSafetyCategories = false
}: {
  evidenceReadinessGate: ReturnType<typeof deriveEvidenceReadinessGate>;
  evidenceReadinessTrend: ReturnType<typeof deriveEvidenceReadinessTrend>;
  includeReadinessCards?: boolean;
  readinessHistoryLoaded: boolean;
  reviewAnalytics: ReturnType<typeof deriveReviewAnalytics>;
  blockerDetail?: string;
  includeSafetyCategories?: boolean;
}) {
  return (
    <div className="list">
      {includeReadinessCards ? (
        <>
          <EvidenceReadinessGateCard gate={evidenceReadinessGate} />
          <EvidenceReadinessTrendCard isLoaded={readinessHistoryLoaded} trend={evidenceReadinessTrend} />
        </>
      ) : null}
      <div className="row">
        <div>
          <strong>Decision mix</strong>
          <p>
            Accepted {reviewAnalytics.decisionCounts.accept}, rejected {reviewAnalytics.decisionCounts.reject}, deferred{" "}
            {reviewAnalytics.decisionCounts.defer}, pending {reviewAnalytics.decisionCounts.pending}
          </p>
        </div>
      </div>
      {reviewAnalytics.blockerCategories.map((item) => (
        <div className="row" key={item.label}>
          <div>
            <strong>{item.label}</strong>
            <p>{blockerDetail}</p>
          </div>
          <span className="pill">{item.count} cases</span>
        </div>
      ))}
      {includeSafetyCategories
        ? reviewAnalytics.safetyCategories.map((item) => (
            <div className="row" key={item.label}>
              <div>
                <strong>{item.label}</strong>
                <p>Most frequent safety flag in the current dataset.</p>
              </div>
              <span className="pill">{item.count} mentions</span>
            </div>
          ))
        : null}
    </div>
  );
}

export function BenchmarkActionLinks({
  demoMode,
  query,
  recordingMode
}: {
  demoMode: boolean;
  query: string;
  recordingMode: boolean;
}) {
  return (
    <div className="actions">
      <a className="button secondary" href={`/review/benchmarks?status=all${demoMode ? "&demo=1" : ""}${recordingMode ? "&recording=1" : ""}`}>
        Open Drilldown
      </a>
      <a className="button secondary" href={`/review/benchmarks?status=failed${demoMode ? "&demo=1" : ""}${recordingMode ? "&recording=1" : ""}`}>
        Failed Only
      </a>
      <a className="button secondary" href={`/review/benchmarks/report${query}`}>
        Benchmark Report
      </a>
      <a className="button secondary" href={`/review/readiness${query}`}>
        Evidence Readiness
      </a>
      <a className="button secondary" href={`/api/readiness/evidence${query}`}>
        Export Readiness
      </a>
    </div>
  );
}

export function ClinicalScenarioBenchmarkList({
  actionQueue,
  includeReadinessWorkspace = false,
  latestSignoff,
  query,
  scenarioBenchmark,
  signoffLoaded
}: {
  actionQueue: ReturnType<typeof deriveScenarioBenchmarkActionQueue>;
  includeReadinessWorkspace?: boolean;
  latestSignoff?: BenchmarkSignoffEntry;
  query: string;
  scenarioBenchmark: ReturnType<typeof deriveScenarioBenchmark>;
  signoffLoaded: boolean;
}) {
  return (
    <div className="list">
      <div className="row">
        <div>
          <strong>Expected outcome pass rate</strong>
          <p>
            {scenarioBenchmark.passed} of {scenarioBenchmark.total} synthetic benchmark cases match their expected clinical outcome.
          </p>
        </div>
        <span className={`tag ${scenarioBenchmark.failed ? "danger" : "ok"}`}>
          {scenarioBenchmark.failed ? `${scenarioBenchmark.failed} failed` : "passing"}
        </span>
      </div>
      <BenchmarkActionQueueSummary actionQueue={actionQueue} />
      <BenchmarkSignoffSummary isLoaded={signoffLoaded} latest={latestSignoff} />
      {includeReadinessWorkspace ? (
        <div className="row">
          <div>
            <strong>Readiness workspace</strong>
            <p>Open the full gate view to see blockers, follow-ups, and direct resolution links.</p>
          </div>
          <a className="button secondary" href={`/review/readiness${query}`}>
            Open
          </a>
        </div>
      ) : null}
      {scenarioBenchmark.cases.map((item) => (
        <div className="row" key={item.caseId}>
          <div>
            <strong>{item.patientLabel}</strong>
            <p>{item.scenarioClass}</p>
            {item.checks
              .filter((check) => !check.passed)
              .map((check) => (
                <p key={check.label}>
                  {check.label}: expected {check.expected}; actual {check.actual}
                </p>
              ))}
          </div>
          <div className="actions">
            <span className={`tag ${item.passed ? "ok" : "danger"}`}>{item.passed ? "pass" : "fail"}</span>
            <a className="button secondary" href={`/cases/${item.caseId}${query}`}>
              Case
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ClinicalRuleCoverageSection({
  clinicalRuleCoverage,
  demoMode,
  headingLevel = "h3",
  recordingMode,
  sectionClassName = "span-6 panel stack"
}: {
  clinicalRuleCoverage: ReturnType<typeof deriveClinicalRuleCoverageMatrix>;
  demoMode: boolean;
  headingLevel?: "h2" | "h3";
  recordingMode: boolean;
  sectionClassName?: string;
}) {
  const Heading = headingLevel;

  return (
    <section className={sectionClassName}>
      <Heading>Clinical Rule Coverage</Heading>
      <div className="actions">
        <a className="button secondary" href={`/review/benchmarks?status=all${demoMode ? "&demo=1" : ""}${recordingMode ? "&recording=1" : ""}`}>
          Inspect Coverage
        </a>
      </div>
      <div className="list">
        <div className="row">
          <div>
            <strong>Coverage targets</strong>
            <p>
              {clinicalRuleCoverage.coveredTargets} of {clinicalRuleCoverage.totalTargets} UK clinical risk classes have benchmarked scenario coverage.
            </p>
          </div>
          <span className={`tag ${clinicalRuleCoverage.missingTargets ? "danger" : clinicalRuleCoverage.needsExpectedOutcomeTargets ? "warn" : "ok"}`}>
            {clinicalRuleCoverage.missingTargets} missing
          </span>
        </div>
        {clinicalRuleCoverage.rows.map((item) => (
          <div className="row" key={item.id}>
            <div>
              <strong>{item.label}</strong>
              <p>
                {item.caseCount} case(s), {item.benchmarkedCount} benchmarked.
              </p>
              {item.cases.length ? <p>{item.cases.map((caseItem) => caseItem.patientLabel).join(", ")}</p> : null}
            </div>
            <span className={`tag ${item.status === "covered" ? "ok" : item.status === "needs_expected_outcome" ? "warn" : "danger"}`}>
              {item.status.replaceAll("_", " ")}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function MeetingOutcomeSignalsList({
  includeSeparateRepairCounts = false,
  meetingOutcomeAnalytics,
  meetingOutcomeEscalation
}: {
  includeSeparateRepairCounts?: boolean;
  meetingOutcomeAnalytics: ReturnType<typeof deriveMeetingOutcomeAnalytics>;
  meetingOutcomeEscalation: ReturnType<typeof deriveMeetingOutcomeEscalation>;
}) {
  return (
    <div className="list">
      <div className="row">
        <div>
          <strong>Promote</strong>
          <p>
            {includeSeparateRepairCounts
              ? "Cases marked for forward movement during internal review meetings."
              : "Cases explicitly marked for forward movement in internal review meetings."}
          </p>
        </div>
        <span className="pill">{meetingOutcomeAnalytics.counts.promote}</span>
      </div>
      <div className="row">
        <div>
          <strong>Hold</strong>
          <p>{includeSeparateRepairCounts ? "Cases intentionally held in place pending a later review cycle." : "Cases intentionally left in place pending later review."}</p>
        </div>
        <span className="pill">{meetingOutcomeAnalytics.counts.hold}</span>
      </div>
      {includeSeparateRepairCounts ? (
        <>
          <div className="row">
            <div>
              <strong>Remediate</strong>
              <p>Cases that left the meeting with explicit remediation work.</p>
            </div>
            <span className="pill">{meetingOutcomeAnalytics.counts.remediate}</span>
          </div>
          <div className="row">
            <div>
              <strong>Needs evidence</strong>
              <p>Cases needing more supporting evidence before promotion discussions continue.</p>
            </div>
            <span className="pill">{meetingOutcomeAnalytics.counts.needs_evidence}</span>
          </div>
          <div className="row">
            <div>
              <strong>Outcome not captured</strong>
              <p>Cases still missing an explicit meeting decision.</p>
            </div>
            <span className="pill">{meetingOutcomeAnalytics.missingCount}</span>
          </div>
        </>
      ) : (
        <>
          <div className="row">
            <div>
              <strong>Remediate / Needs evidence</strong>
              <p>Cases that left the meeting with explicit repair or evidence follow-up.</p>
            </div>
            <span className="pill">
              {meetingOutcomeAnalytics.counts.remediate + meetingOutcomeAnalytics.counts.needs_evidence}
            </span>
          </div>
          <div className="row">
            <div>
              <strong>Uncaptured</strong>
              <p>Cases that still need a recorded meeting disposition.</p>
            </div>
            <span className="pill">{meetingOutcomeAnalytics.missingCount}</span>
          </div>
        </>
      )}
      <div className="row">
        <div>
          <strong>Overdue actions</strong>
          <p>Meeting outcomes that have breached their follow-through SLA.</p>
        </div>
        <span className="pill">{meetingOutcomeEscalation.overdueCount}</span>
      </div>
      <div className="row">
        <div>
          <strong>Due today</strong>
          <p>Meeting outcomes that reach their SLA threshold today.</p>
        </div>
        <span className="pill">{meetingOutcomeEscalation.dueTodayCount}</span>
      </div>
    </div>
  );
}

export function MeetingOutcomeEscalationsList({
  keyPrefix,
  meetingOutcomeEscalation
}: {
  keyPrefix: string;
  meetingOutcomeEscalation: ReturnType<typeof deriveMeetingOutcomeEscalation>;
}) {
  return (
    <div className="list">
      {meetingOutcomeEscalation.overdueItems.length ? (
        meetingOutcomeEscalation.overdueItems.map((item) => (
          <div className="row" key={`${keyPrefix}-overdue-${item.id}`}>
            <div>
              <strong>{item.patientLabel}</strong>
              <p>
                {item.dispositionLabel} · {item.slaLabel} · {item.ageDays} day(s) old
              </p>
              <p>{item.owner ? `Owner: ${item.owner}` : "Owner: unassigned"}</p>
              <p>{item.slaDetail}</p>
              <p>{item.note ?? item.actionTitle}</p>
            </div>
            <div className="actions">
              <span className="tag danger">overdue</span>
              <a className="button secondary" href={item.href}>
                {item.actionLabel}
              </a>
            </div>
          </div>
        ))
      ) : meetingOutcomeEscalation.dueTodayItems.length ? (
        meetingOutcomeEscalation.dueTodayItems.map((item) => (
          <div className="row" key={`${keyPrefix}-due-${item.id}`}>
            <div>
              <strong>{item.patientLabel}</strong>
              <p>
                {item.dispositionLabel} · {item.slaLabel}
              </p>
              <p>{item.owner ? `Owner: ${item.owner}` : "Owner: unassigned"}</p>
              <p>{item.slaDetail}</p>
              <p>{item.note ?? item.actionTitle}</p>
            </div>
            <div className="actions">
              <span className="tag warn">due today</span>
              <a className="button secondary" href={item.href}>
                {item.actionLabel}
              </a>
            </div>
          </div>
        ))
      ) : (
        <div className="row">
          <div>
            <strong>No SLA escalations</strong>
            <p>Meeting-driven follow-through is currently within target windows.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function ReadOnlyOwnerWorkloadList({
  meetingOwnerWorkload
}: {
  meetingOwnerWorkload: ReturnType<typeof deriveMeetingOwnerWorkload>;
}) {
  return (
    <div className="list">
      {meetingOwnerWorkload.length ? (
        meetingOwnerWorkload.map((item) => (
          <div className="row" key={`owner-summary-${item.owner}`}>
            <div>
              <strong>{item.owner}</strong>
              <p>
                {item.totalAssigned} assigned · {item.overdueCount} overdue · {item.needsEvidenceCount} needs evidence ·{" "}
                {item.carryoverCount} carryover
              </p>
              <p>
                {item.topCases.length
                  ? `Top cases: ${item.topCases.map((topCase) => `${topCase.patientLabel} (${topCase.slaLabel.toLowerCase()})`).join(", ")}`
                  : "No active assigned cases."}
              </p>
            </div>
            <div className="actions">
              <span className={`tag ${item.overdueCount > 0 ? "danger" : item.totalAssigned >= 3 ? "warn" : "ok"}`}>
                {item.overdueCount > 0 ? "overloaded" : item.totalAssigned >= 3 ? "busy" : "balanced"}
              </span>
            </div>
          </div>
        ))
      ) : (
        <div className="row">
          <div>
            <strong>No owner assignments yet</strong>
            <p>Meeting follow-through owners have not been captured for the current cohort.</p>
          </div>
        </div>
      )}
    </div>
  );
}
