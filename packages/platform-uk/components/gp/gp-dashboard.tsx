"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { GpAgentControlPanel } from "@/components/gp/agent-control-panel";
import { GpPatientPanel } from "@/components/gp/patient-panel";
import { GpReviewQueuePanel } from "@/components/gp/review-queue-panel";
import { VoiceMicPanel } from "@/components/gp/voice-mic-panel";
import { GOLDEN_SCENARIO_PATEL_DEMO_ID, GOLDEN_SCENARIO_V_UK1_ID, deriveAgentCards } from "@/lib/agents";
import { useReviewCases } from "@/lib/use-review-cases";
import type { ReviewQueueItemType } from "@/lib/types";
import { resolveReviewQueueItems, updateQueueItemDecision } from "@/lib/workflow";

export function GpDashboardClient({ caseId = GOLDEN_SCENARIO_PATEL_DEMO_ID }: { caseId?: string }) {
  const { cases, getCaseById, isLoaded, updateCase } = useReviewCases();
  const [reviewerName, setReviewerName] = useState("Dr Morgan");
  const [agentFilter, setAgentFilter] = useState<ReviewQueueItemType | null>(null);
  const [offerHealthPlanOnAccept, setOfferHealthPlanOnAccept] = useState(false);
  const [spineNotice, setSpineNotice] = useState<string | null>(null);

  const reviewCase = useMemo(() => {
    if (!isLoaded) return null;
    return (
      getCaseById(caseId) ??
      cases.find((item) => item.scenarioId === "PATEL-DEMO") ??
      getCaseById(GOLDEN_SCENARIO_V_UK1_ID) ??
      cases.find((item) => item.scenarioId === "V-UK1") ??
      null
    );
  }, [caseId, cases, getCaseById, isLoaded]);

  if (!isLoaded) {
    return <div className="panel">Loading GP dashboard...</div>;
  }

  if (!reviewCase) {
    return (
      <div className="panel stack">
        <h2>GP dashboard</h2>
        <p>
          Golden Patel case not found. Seed patient data with <code>npm run data:seed</code> or{" "}
          <code>npm run data:seed:postgres</code>.
        </p>
        <Link className="button primary" href="/review">
          Open review queue
        </Link>
      </div>
    );
  }

  const activeCase = reviewCase;
  const queueItems = resolveReviewQueueItems(activeCase);
  const agentCards = deriveAgentCards(activeCase);

  async function persist(
    nextCase: typeof activeCase,
    options?: { offerHealthPlan?: boolean }
  ) {
    if (!nextCase) return;
    const result = await updateCase(nextCase, options);
    if (result?.spine?.learningEventIds?.length) {
      const planBit = result.spine.healthPlanId
        ? ` · health-plan draft ${result.spine.healthPlanId} (HITL, ehrWrite:false)`
        : "";
      setSpineNotice(
        `Spine recorded: ${result.spine.learningEventIds.length} learning event(s) for ${result.spine.patientId}${planBit}.`
      );
    }
  }

  function handleAccept(itemId: string) {
    if (!reviewCase) return;
    void persist(updateQueueItemDecision(activeCase, itemId, "ACCEPTED", { decidedBy: reviewerName }), {
      offerHealthPlan: offerHealthPlanOnAccept
    });
  }

  function handleReject(itemId: string, reason: string) {
    if (!reviewCase) return;
    void persist(
      updateQueueItemDecision(activeCase, itemId, "REJECTED", {
        decidedBy: reviewerName,
        rejectionReason: reason
      })
    );
  }

  function handleEdit(itemId: string, content: string) {
    if (!reviewCase) return;
    void persist(
      updateQueueItemDecision(activeCase, itemId, "DRAFT", { decidedBy: reviewerName, content })
    );
  }

  function handleVoiceTranscript(transcript: string) {
    if (!reviewCase) return;
    const items = resolveReviewQueueItems(activeCase).map((item) =>
      item.itemType === "voice_transcript"
        ? {
            ...item,
            summary: transcript.slice(0, 120) + (transcript.length > 120 ? "…" : ""),
            content: transcript
          }
        : item
    );
    void persist({
      ...activeCase,
      input: { ...activeCase.input, summary: transcript, sourceType: "transcript" as const },
      reviewQueueItems: items
    });
  }

  return (
    <div className="stack gp-dashboard">
      <header className="gp-dashboard__hero panel">
        <div>
          <p className="gp-panel__eyebrow">Clinician three-column layout</p>
          <h1>Clinician Dashboard</h1>
          <p>
            Patient context, AI review queue, and agent control panel with human-in-the-loop review.
            Scenario <strong>{activeCase.scenarioId ?? "custom"}</strong>. Every Accept / Edit /
            Reject writes SHIELD + a learning event on the clinical spine (no auto-retrain, no live
            EMIS).
          </p>
        </div>
        <div className="actions">
          <Link className="button secondary" href={`/cases/${reviewCase.id}`}>
            Full case review
          </Link>
          <Link className="button secondary" href="/demo/patel">
            Patel demo launcher
          </Link>
          <Link className="button secondary" href="/review">
            All cases
          </Link>
        </div>
      </header>

      <div className="gp-dashboard__toolbar panel">
        <label className="gp-reviewer-field">
          <span>Reviewer name</span>
          <input onChange={(event) => setReviewerName(event.target.value)} value={reviewerName} />
        </label>
        <label className="gp-reviewer-field" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input
            type="checkbox"
            checked={offerHealthPlanOnAccept}
            onChange={(event) => setOfferHealthPlanOnAccept(event.target.checked)}
            data-testid="offer-health-plan-on-accept"
          />
          <span>After Accept, draft health plan (HITL · ehrWrite:false)</span>
        </label>
        {reviewCase.oracleRiskScore ? (
          <div className="gp-oracle-strip">
            <span className="pill">ORACLE baseline {reviewCase.oracleRiskScore.baseline}</span>
            <span className="pill">Current {reviewCase.oracleRiskScore.current}</span>
            <span className="pill">Δ +{reviewCase.oracleRiskScore.current - reviewCase.oracleRiskScore.baseline}</span>
          </div>
        ) : null}
      </div>

      {spineNotice ? (
        <div className="panel" data-testid="spine-decision-notice" role="status">
          <p>{spineNotice}</p>
          <p className="text-muted" style={{ marginTop: "0.35rem", fontSize: "0.85rem" }}>
            Timeline and learning surfaces update from the same events —{" "}
            <Link href="/dashboard/admin/learning">learning</Link> ·{" "}
            <Link href="/dashboard/admin/audit">SHIELD audit</Link>.
          </p>
        </div>
      ) : null}

      <div className="gp-dashboard__columns">
        <div className="stack">
          <GpPatientPanel reviewCase={reviewCase} />
          <VoiceMicPanel initialSummary={reviewCase.input.summary} onTranscript={handleVoiceTranscript} />
        </div>
        <GpReviewQueuePanel
          agentFilter={agentFilter}
          items={queueItems}
          onAccept={handleAccept}
          onEdit={handleEdit}
          onReject={handleReject}
          reviewerName={reviewerName}
        />
        <GpAgentControlPanel activeFilter={agentFilter} cards={agentCards} onFilterChange={(f) => setAgentFilter(f as ReviewQueueItemType | null)} />
      </div>
    </div>
  );
}
