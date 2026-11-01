"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { HcpEvalCase, HcpCaseKind } from "@/lib/eval/hcp-case-pack";
import type { HcpFeedbackDecision, HcpRubricId } from "@/lib/eval/hcp-feedback";
import {
  buildHcpFeedbackRequestBody,
  HCP_FACILITATOR_HONESTY,
  relatedGoldenFixtures,
  rubricLabel,
  suggestRubricsForCase,
  validateFacilitatorFeedbackDraft,
} from "@/lib/eval/hcp-facilitator-session";

type CasePackPayload = {
  version: string;
  caseCount: number;
  syntheticOnly: true;
  clinicalValidationClaim: false;
  ehrWrite: false;
  honesty?: string[];
  cases: HcpEvalCase[];
  error?: string;
};

type GoldenFixtureRow = {
  id: string;
  agent: "SYNTHESIS" | "GUARDIAN" | "ORACLE";
  label: string;
  input?: {
    transcript?: string;
    patientLabel?: string;
    patientId?: string;
    proposedDrug?: string;
  };
};

type EvalAgentsPayload = {
  available?: boolean;
  fixtures?: GoldenFixtureRow[];
  ehrWrite?: false;
  hitlRequired?: true;
  note?: string;
};

type RubricDraft = {
  rubricId: HcpRubricId;
  score: number;
  justification: string;
};

type SubmitResult = {
  recorded: boolean;
  event?: { id: string; decision: string; casePackCaseId: string; agentLabel: string };
  clinicalValidationClaim?: false;
  error?: string;
};

const DECISIONS: { value: HcpFeedbackDecision; label: string }[] = [
  { value: "accept", label: "Accept" },
  { value: "edit", label: "Edit" },
  { value: "reject", label: "Reject" },
];

const RECS: { value: "proceed" | "hold" | "redesign"; label: string }[] = [
  { value: "proceed", label: "Proceed (stay in validation)" },
  { value: "hold", label: "Hold" },
  { value: "redesign", label: "Redesign" },
];

function kindLabel(kind: HcpCaseKind): string {
  return kind.replace(/_/g, " ");
}

function emptyRubrics(ids: HcpRubricId[]): RubricDraft[] {
  return ids.map((rubricId) => ({ rubricId, score: 4, justification: "" }));
}

/**
 * Facilitator-led synthetic HCP session: case-pack picker + Accept/Edit/Reject + rubrics.
 * Wires existing Milestone B APIs — no curl/JSON required.
 */
export function HcpFacilitatorSessionPanel() {
  const [pack, setPack] = useState<CasePackPayload | null>(null);
  const [fixtures, setFixtures] = useState<GoldenFixtureRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [agentLabel, setAgentLabel] = useState("");
  const [decision, setDecision] = useState<HcpFeedbackDecision>("edit");
  const [rubrics, setRubrics] = useState<RubricDraft[]>([]);
  const [trustHonesty, setTrustHonesty] = useState(4);
  const [recommendation, setRecommendation] = useState<"proceed" | "hold" | "redesign">("hold");
  const [facilitatorNotes, setFacilitatorNotes] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [safetyMiss, setSafetyMiss] = useState(false);
  const [safetyMissDetail, setSafetyMissDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<SubmitResult | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [packRes, evalRes] = await Promise.all([
        fetch("/api/eval/hcp-case-pack", { credentials: "include" }),
        fetch("/api/eval/agents", { credentials: "include" }),
      ]);
      if (!packRes.ok) {
        throw new Error(
          packRes.status === 401 || packRes.status === 403
            ? `Case pack requires a clinical or Agent Ops role (${packRes.status}).`
            : `Case pack failed (${packRes.status}).`
        );
      }
      const packJson = (await packRes.json()) as CasePackPayload;
      setPack(packJson);
      setSelectedCaseId((prev) => prev || packJson.cases?.[0]?.id || "");
      if (evalRes.ok) {
        const evalJson = (await evalRes.json()) as EvalAgentsPayload;
        setFixtures(evalJson.fixtures ?? []);
      } else {
        setFixtures([]);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load session pack");
      setPack(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedCase = useMemo(
    () => pack?.cases.find((c) => c.id === selectedCaseId) ?? null,
    [pack, selectedCaseId]
  );

  useEffect(() => {
    if (!selectedCase) return;
    const suggested = suggestRubricsForCase(selectedCase);
    setRubrics(emptyRubrics(suggested));
    setAgentLabel(selectedCase.rubricAgents[0] ?? selectedCase.expectation.agentsInFocus[0] ?? "");
    setLastResult(null);
    setFormError(null);
  }, [selectedCase]);

  const relatedFixtures = useMemo(() => {
    if (!selectedCase) return [];
    return relatedGoldenFixtures(
      selectedCase,
      fixtures.map((f) => ({
        id: f.id,
        agent: f.agent,
        label: f.label,
        input: f.input ?? {},
      }))
    );
  }, [selectedCase, fixtures]);

  const reviewQueueHref = selectedCase
    ? `/dashboard/gp/review-queue?patient=${encodeURIComponent(selectedCase.syntheticPatientId)}`
    : "/dashboard/gp/review-queue";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setLastResult(null);

    const draft = {
      casePackCaseId: selectedCaseId,
      agentLabel,
      decision,
      syntheticPatientId: selectedCase?.syntheticPatientId,
      sessionId: sessionId || undefined,
      facilitatorNotes: facilitatorNotes || undefined,
      safetyMiss,
      safetyMissDetail: safetyMiss ? safetyMissDetail : undefined,
      rubrics: rubrics.map((r) => ({
        rubricId: r.rubricId,
        score: r.score,
        justification: r.justification || undefined,
      })),
      trustHonestyLabels: trustHonesty,
      recommendation,
    };

    const clientErr = validateFacilitatorFeedbackDraft(draft);
    if (clientErr) {
      setFormError(clientErr);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/eval/hcp-feedback", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildHcpFeedbackRequestBody(draft)),
      });
      const json = (await res.json()) as SubmitResult & { error?: string };
      if (!res.ok) {
        setFormError(json.error ?? `Submit failed (${res.status}). Clinical reviewer role required.`);
        return;
      }
      setLastResult(json);
      setFacilitatorNotes("");
      setSafetyMiss(false);
      setSafetyMissDetail("");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Network error submitting feedback");
    } finally {
      setSubmitting(false);
    }
  }

  function updateRubric(index: number, patch: Partial<RubricDraft>) {
    setRubrics((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <div className="space-y-6" data-testid="hcp-facilitator-session">
      <section
        className="rounded-lg border border-border bg-surface-raised/40 p-4 space-y-2"
        data-testid="hcp-session-honesty"
        role="status"
      >
        <h2 className="text-sm font-semibold tracking-tight">HCP session honesty</h2>
        <ul className="text-xs text-muted space-y-1 list-disc pl-4">
          {(pack?.honesty?.length ? pack.honesty : HCP_FACILITATOR_HONESTY).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="text-[11px] text-muted">
          Milestone C1 facilitator UI · synthetic case pack only · clinicalValidationClaim: false · ehrWrite: false.
          Docs: docs/milestone-c/FACILITATOR_SESSION.md
        </p>
      </section>

      <div className="flex flex-wrap gap-3 text-xs">
        <Link
          href="/dashboard/admin/agent-ops"
          className="underline text-primary"
          data-testid="hcp-session-link-agent-ops"
        >
          Agent Ops aggregates
        </Link>
        <Link href={reviewQueueHref} className="underline text-primary" data-testid="hcp-session-link-review-queue">
          GP review queue{selectedCase ? ` (${selectedCase.syntheticPatientId})` : ""}
          {" · honesty strip (C2)"}
        </Link>
        <Link
          href={
            selectedCase
              ? `/dashboard/gp/lab-pharmacy?patientId=${encodeURIComponent(selectedCase.syntheticPatientId)}`
              : "/dashboard/gp/lab-pharmacy"
          }
          className="underline text-primary"
          data-testid="hcp-session-link-lab-pharmacy"
        >
          Lab / pharmacy HITL (C3)
        </Link>
        <Link href="/dashboard/admin/lab-queue" className="underline text-primary" data-testid="hcp-session-link-lab-queue">
          Lab queue
        </Link>
        <Link
          href="/dashboard/pharmacist/pharmacy-queue"
          className="underline text-primary"
          data-testid="hcp-session-link-pharmacy-queue"
        >
          Pharmacy queue
        </Link>
        <button
          type="button"
          className="underline text-primary"
          onClick={() => void load()}
          data-testid="hcp-session-reload"
        >
          Reload case pack
        </button>
      </div>

      {loading && <p className="text-sm text-muted">Loading synthetic case pack…</p>}
      {loadError && (
        <p className="text-sm text-amber-800" role="alert" data-testid="hcp-session-load-error">
          {loadError}
        </p>
      )}

      {pack && (
        <section className="space-y-3" data-testid="hcp-case-pack-picker">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold">Case pack</h2>
            <p className="text-xs text-muted">
              {pack.version} · {pack.caseCount} cases · syntheticOnly · not clinical validation
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {pack.cases.map((c) => {
              const active = c.id === selectedCaseId;
              return (
                <button
                  key={c.id}
                  type="button"
                  data-testid={`hcp-case-${c.id}`}
                  data-case-id={c.id}
                  onClick={() => setSelectedCaseId(c.id)}
                  className={
                    active
                      ? "rounded-md border border-primary bg-primary/5 px-3 py-2 text-left text-xs space-y-1"
                      : "rounded-md border border-border px-3 py-2 text-left text-xs space-y-1 hover:border-primary/40"
                  }
                >
                  <div className="font-medium">{c.label}</div>
                  <div className="text-muted">
                    {c.sessionDayHint} · {kindLabel(c.kind)} · patient {c.syntheticPatientId}
                  </div>
                  <div className="text-[11px] text-muted">
                    Focus: {c.expectation.agentsInFocus.join(", ")} · HITL · no EHR write
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {selectedCase && (
        <section className="space-y-3 rounded-lg border border-border p-4" data-testid="hcp-case-brief">
          <h2 className="text-sm font-semibold">Session brief</h2>
          <dl className="grid gap-2 text-xs sm:grid-cols-2">
            <div>
              <dt className="text-muted">Case id</dt>
              <dd className="font-mono">{selectedCase.id}</dd>
            </div>
            <div>
              <dt className="text-muted">Synthetic patient</dt>
              <dd className="font-mono">{selectedCase.syntheticPatientId}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted">Facilitator notes from pack</dt>
              <dd>{selectedCase.expectation.notes}</dd>
            </div>
            {selectedCase.transcriptHint ? (
              <div className="sm:col-span-2">
                <dt className="text-muted">Transcript hint (synthetic)</dt>
                <dd className="whitespace-pre-wrap">{selectedCase.transcriptHint}</dd>
              </div>
            ) : null}
            {selectedCase.proposedDrug ? (
              <div>
                <dt className="text-muted">Proposed drug (hazard)</dt>
                <dd>{selectedCase.proposedDrug}</dd>
              </div>
            ) : null}
            {selectedCase.expectation.expectedGuardianOutcome ? (
              <div>
                <dt className="text-muted">Expected GUARDIAN / gateway</dt>
                <dd>{selectedCase.expectation.expectedGuardianOutcome}</dd>
              </div>
            ) : null}
          </dl>

          <div className="space-y-2" data-testid="hcp-related-harness">
            <h3 className="text-xs font-semibold">Related golden harness fixtures</h3>
            {relatedFixtures.length === 0 ? (
              <p className="text-xs text-muted">
                No overlapping golden fixtures for this case. Run agents via GP review queue / orchestrate on the
                synthetic patient, then score here.
              </p>
            ) : (
              <ul className="space-y-2 text-xs">
                {relatedFixtures.map((f) => (
                  <li key={f.id} className="rounded-md border border-border/80 px-3 py-2 space-y-1">
                    <div className="font-medium">
                      {f.agent} · {f.label}
                    </div>
                    <div className="font-mono text-[11px] text-muted">{f.id}</div>
                    {f.input.transcript ? (
                      <p className="text-muted whitespace-pre-wrap line-clamp-4">{f.input.transcript}</p>
                    ) : null}
                    {f.input.proposedDrug ? (
                      <p className="text-muted">Proposed drug: {f.input.proposedDrug}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {selectedCase && (
        <form
          className="space-y-4 rounded-lg border border-border p-4"
          onSubmit={onSubmit}
          data-testid="hcp-feedback-form"
        >
          <h2 className="text-sm font-semibold">Capture feedback</h2>
          <p className="text-xs text-muted">
            Posts to <code className="text-[11px]">POST /api/eval/hcp-feedback</code>. Requires clinical reviewer
            (GP / nurse / pharmacist mapped role). Justification required when any rubric score is ≤3.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs">
              <span className="font-medium">Agent label</span>
              <Select value={agentLabel} onValueChange={setAgentLabel}>
                <SelectTrigger data-testid="hcp-feedback-agent">
                  <SelectValue placeholder="Agent" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    ...new Set([
                      ...selectedCase.rubricAgents,
                      ...selectedCase.expectation.agentsInFocus,
                    ]),
                  ].map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="space-y-1 text-xs">
              <span className="font-medium">Decision</span>
              <Select value={decision} onValueChange={(v) => setDecision(v as HcpFeedbackDecision)}>
                <SelectTrigger data-testid="hcp-feedback-decision">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DECISIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="space-y-1 text-xs">
              <span className="font-medium">Recommendation</span>
              <Select
                value={recommendation}
                onValueChange={(v) => setRecommendation(v as "proceed" | "hold" | "redesign")}
              >
                <SelectTrigger data-testid="hcp-feedback-recommendation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="space-y-1 text-xs">
              <span className="font-medium">Trust in honesty labels (1–5)</span>
              <Select
                value={String(trustHonesty)}
                onValueChange={(v) => setTrustHonesty(Number(v))}
              >
                <SelectTrigger data-testid="hcp-feedback-trust">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="space-y-1 text-xs sm:col-span-2">
              <span className="font-medium">Session id (optional)</span>
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="e.g. week1-day1-facilitator-a"
                data-testid="hcp-feedback-session-id"
              />
            </label>
          </div>

          <div className="space-y-3" data-testid="hcp-feedback-rubrics">
            <h3 className="text-xs font-semibold">Rubric scores (1–5)</h3>
            {rubrics.map((row, index) => (
              <div
                key={row.rubricId}
                className="grid gap-2 rounded-md border border-border/70 p-3 sm:grid-cols-[1fr_5rem]"
                data-testid={`hcp-rubric-${row.rubricId}`}
              >
                <div className="space-y-1">
                  <div className="text-xs font-medium">{rubricLabel(row.rubricId)}</div>
                  <textarea
                    className="w-full min-h-[2.5rem] rounded-md border border-border bg-background px-2 py-1.5 text-xs"
                    placeholder={row.score <= 3 ? "Justification required (score ≤3)" : "Optional justification"}
                    value={row.justification}
                    onChange={(e) => updateRubric(index, { justification: e.target.value })}
                    data-testid={`hcp-rubric-justification-${row.rubricId}`}
                  />
                </div>
                <label className="space-y-1 text-xs">
                  <span className="text-muted">Score</span>
                  <Select
                    value={String(row.score)}
                    onValueChange={(v) => updateRubric(index, { score: Number(v) })}
                  >
                    <SelectTrigger data-testid={`hcp-rubric-score-${row.rubricId}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              </div>
            ))}
          </div>

          <label className="flex items-start gap-2 text-xs">
            <input
              type="checkbox"
              checked={safetyMiss}
              onChange={(e) => setSafetyMiss(e.target.checked)}
              className="mt-0.5"
              data-testid="hcp-feedback-safety-miss"
            />
            <span>
              Safety miss observed (known hazard not surfaced, or HITL bypassed). Does not auto-file an alert.
            </span>
          </label>
          {safetyMiss ? (
            <textarea
              className="w-full min-h-[3rem] rounded-md border border-border bg-background px-3 py-2 text-xs"
              placeholder="Describe the safety miss (required)"
              value={safetyMissDetail}
              onChange={(e) => setSafetyMissDetail(e.target.value)}
              data-testid="hcp-feedback-safety-detail"
            />
          ) : null}

          <label className="space-y-1 text-xs block">
            <span className="font-medium">Facilitator notes (optional)</span>
            <textarea
              className="w-full min-h-[3.5rem] rounded-md border border-border bg-background px-3 py-2 text-xs"
              value={facilitatorNotes}
              onChange={(e) => setFacilitatorNotes(e.target.value)}
              placeholder="Synthetic session notes — stored scoped; omitted from admin aggregates"
              data-testid="hcp-feedback-notes"
            />
          </label>

          {formError ? (
            <p className="text-sm text-amber-800" role="alert" data-testid="hcp-feedback-error">
              {formError}
            </p>
          ) : null}
          {lastResult?.recorded ? (
            <p className="text-sm text-secondary" data-testid="hcp-feedback-success">
              Recorded {lastResult.event?.id} · {lastResult.event?.decision} ·{" "}
              {lastResult.event?.agentLabel} on {lastResult.event?.casePackCaseId}. Not a clinical validation
              certificate.
            </p>
          ) : null}

          <Button type="submit" disabled={submitting} data-testid="hcp-feedback-submit">
            {submitting ? "Saving…" : "Save Accept/Edit/Reject + rubrics"}
          </Button>
        </form>
      )}
    </div>
  );
}
