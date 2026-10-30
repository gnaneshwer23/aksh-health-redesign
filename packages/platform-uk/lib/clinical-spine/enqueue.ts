/**
 * Closes the agent loop for a care-network patient (Volume I FLOW-JRN-1, steps 4→5): the drafts CONDUCTOR produced
 * become review-queue items on a review case, in CONDUCTOR's review order, for a clinician to accept, edit or reject on
 * the server. Referrals indicated by the complication checks are held and drafted by PATHWAY only after the note and
 * codes are accepted (FR-AGT-024). Pure: the route persists the case. Simulation only (Track B gate unchanged).
 */
import { CLINICAL_AGENT_META } from "../agents";
import type { AgentRunSummary, ClinicalAgentId, ReviewCase, ReviewQueueItem } from "../types";
import { createReviewCaseFromIntake } from "../workflow/review";

import type { ClinicalSpineOrchestrateResult } from "./orchestrate";

const pct = (n: number) => `${Math.round(n * 100)}%`;
const lines = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join("\n");

/** Review-queue items from one CONDUCTOR run, in the run's review order. */
export function queueItemsFromRun(caseId: string, result: ClinicalSpineOrchestrateResult): ReviewQueueItem[] {
  const o = result.orchestration.outputs;
  const item = (agentId: ClinicalAgentId, itemType: ReviewQueueItem["itemType"], title: string, summary: string, content: string, metadata: ReviewQueueItem["metadata"] = {}): ReviewQueueItem => ({
    id: `${caseId}-${itemType}`,
    agentId,
    itemType,
    status: "DRAFT",
    title,
    summary,
    content,
    metadata: { agent: CLINICAL_AGENT_META[agentId].label, provenance: "ai_draft", ...metadata },
  });
  const byAgent: Record<string, ReviewQueueItem | null> = {
    SYNTHESIS: item(
      "SYNTHESIS",
      "soap_note",
      "Consultation note draft",
      `${o.SYNTHESIS.mode === "llm" ? "Model" : "Rules"} draft · confidence ${pct(o.SYNTHESIS.confidence)}`,
      lines(`S: ${o.SYNTHESIS.subjective}`, `O: ${o.SYNTHESIS.objective}`, `A: ${o.SYNTHESIS.assessment}`, `P: ${o.SYNTHESIS.plan}`),
      { mode: o.SYNTHESIS.mode, confidence: o.SYNTHESIS.confidence }
    ),
    GUARDIAN:
      o.GUARDIAN.overallStatus === "green" && !o.GUARDIAN.interactions.length && !o.GUARDIAN.safetyNotes.length
        ? null
        : item(
            "GUARDIAN",
            "guardian_alert",
            `Medication safety: ${o.GUARDIAN.overallStatus}`,
            o.GUARDIAN.summary,
            lines(...o.GUARDIAN.clinicianActions.map((a) => `• ${a}`), ...o.GUARDIAN.safetyNotes.map((n) => `Note: ${n}`)),
            { overallStatus: o.GUARDIAN.overallStatus, dataSource: o.GUARDIAN.dataSource, interactions: o.GUARDIAN.interactions.length }
          ),
    ORACLE: item(
      "ORACLE",
      "oracle_update",
      `Risk: ${o.ORACLE.oracleRisk} (${o.ORACLE.oracleScore})`,
      o.ORACLE.summary,
      lines("Contributing factors:", ...o.ORACLE.contributingFactors.map((f) => `• ${f}`)),
      { score: o.ORACLE.oracleScore, band: o.ORACLE.oracleRisk, dataSource: o.ORACLE.dataSource }
    ),
    DrASSIST: o.DrASSIST
      ? item(
          "DrASSIST",
          "diagnosis_codes",
          "Coding suggestions",
          `${o.DrASSIST.codes.length} code(s) for review`,
          lines(...o.DrASSIST.codes.map((c) => `${c.system} ${c.code} ${c.display} (${pct(c.confidence)})`)),
          { codes: o.DrASSIST.codes.map((c) => `${c.system}:${c.code}`) }
        )
      : null,
    NEXUS: null, // review-only input to the assessment; carried on the case (agentRun.correlations), not an item to accept
  };
  return result.orchestration.reviewOrder.map((id) => byAgent[id]).filter((x): x is ReviewQueueItem => Boolean(x));
}

export function agentRunSummary(result: ClinicalSpineOrchestrateResult, now = new Date()): AgentRunSummary {
  const complications = result.diabetes?.signals.complications ?? [];
  const o = result.orchestration.outputs;
  return {
    source: "clinical_spine",
    ranAt: now.toISOString(),
    queuePriority: result.orchestration.queuePriority,
    reviewOrder: result.orchestration.reviewOrder,
    safetyRoute: result.safetyRoute,
    ruleVersion: complications[0]?.ruleVersion ?? "none",
    pendingReferrals: complications
      .filter((c) => c.flagLevel === "referral_indicated")
      .map((c) => ({ domain: c.domain, reason: `${c.domain.replace(/_/g, " ")} referral indicated`, evidence: c.evidenceRefs, ruleIds: c.ruleIds ?? [] })),
    missingLabs: [...new Set(complications.flatMap((c) => c.missingLabs ?? []))],
    correlations: o.NEXUS?.correlations ?? [],
    modelUsed: [o.SYNTHESIS, o.GUARDIAN, o.ORACLE, o.NEXUS, o.DrASSIST].some((d) => d?.mode === "llm"),
  };
}

/** A review case for one agent run: the patient's drafts, in review order, owned by the requesting clinician. */
export function buildSpineReviewCase(input: {
  patientId: string;
  patientLabel: string;
  result: ClinicalSpineOrchestrateResult;
  userId: string;
  now?: Date;
  /** P0-EPISODE-01 — optional care-episode correlation. */
  careEpisodeId?: string;
}): ReviewCase {
  const s = input.result.orchestration.outputs.SYNTHESIS;
  const base = createReviewCaseFromIntake({
    patientLabel: input.patientLabel,
    rawInput: lines(s.subjective, s.objective, s.assessment, s.plan) || `Agent review for ${input.patientLabel}`,
    sourceType: "note",
  });
  const id = `spine-${input.patientId.slice(0, 24)}-${(input.now ?? new Date()).getTime().toString(36)}`;
  return {
    ...base,
    id,
    version: 0,
    userId: input.userId,
    patientId: input.patientId,
    careEpisodeId: input.careEpisodeId,
    summary: `Agent review · ${input.result.orchestration.queuePriority} · ${input.result.safetyRouteLabel}`,
    reviewQueueItems: queueItemsFromRun(id, input.result),
    agentRun: agentRunSummary(input.result, input.now),
  };
}

/**
 * PATHWAY (FR-AGT-024): once the note and the codes are accepted, draft one referral package per referral the
 * complication checks indicated. Each needs a clinician's confirmation (referral_pathway gate). Pure; idempotent.
 */
export function draftPendingReferrals(reviewCase: ReviewCase): ReviewCase {
  const items = reviewCase.reviewQueueItems ?? [];
  const pending = reviewCase.agentRun?.pendingReferrals ?? [];
  const accepted = (t: ReviewQueueItem["itemType"]) => items.find((i) => i.itemType === t)?.status === "ACCEPTED";
  if (!pending.length || !accepted("soap_note") || !accepted("diagnosis_codes")) return reviewCase;
  const added = pending
    .filter((p) => !items.some((i) => i.id === `${reviewCase.id}-referral-${p.domain}`))
    .map<ReviewQueueItem>((p) => ({
      id: `${reviewCase.id}-referral-${p.domain}`,
      agentId: "REFERRAL",
      itemType: "referral_package",
      status: "DRAFT",
      title: `Referral draft: ${p.domain.replace(/_/g, " ")}`,
      summary: `${p.reason}; a clinician confirms before anything is sent`,
      content: lines("PATHWAY: referral package draft", `Reason: ${p.reason}`, "Evidence:", ...p.evidence.map((e) => `• ${e}`), p.ruleIds.length ? `Rules: ${p.ruleIds.join(", ")}` : null, "Status: DRAFT · referral gate: clinician confirmation required"),
      metadata: { agent: "PATHWAY", provenance: "ai_draft", domain: p.domain, rules: p.ruleIds },
    }));
  return added.length ? { ...reviewCase, reviewQueueItems: [...items, ...added] } : reviewCase;
}
