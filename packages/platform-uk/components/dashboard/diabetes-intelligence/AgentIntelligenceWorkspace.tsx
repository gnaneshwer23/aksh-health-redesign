"use client";

import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import type {
  AgentIntelDraft,
  AgentIntelSnapshot,
  StructuredDraftPayload,
} from "@/lib/diabetes-intelligence/agent-intel-types";

type Props = {
  patientId: string;
  patientLabel?: string;
};

export function AgentIntelligenceWorkspace({ patientId, patientLabel }: Props) {
  const [snap, setSnap] = useState<AgentIntelSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/patients/${encodeURIComponent(patientId)}/agent-intelligence`, {
        credentials: "include",
      });
      const data = (await res.json()) as AgentIntelSnapshot & { error?: string };
      if (!res.ok) {
        toast({ title: "Agent intelligence unavailable", description: data.error ?? "Could not load." });
        return;
      }
      setSnap(data);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function postAction(body: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/patients/${encodeURIComponent(patientId)}/agent-intelligence`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as AgentIntelSnapshot & { error?: string };
      if (!res.ok) {
        toast({ title: "Action failed", description: data.error ?? "Request failed." });
        return;
      }
      setSnap(data);
      toast({ title: "Updated", description: "Synthetic agent orchestration advanced." });
    } finally {
      setBusy(false);
    }
  }

  async function decideDraft(
    draft: AgentIntelDraft,
    action: "accept" | "edit" | "reject"
  ) {
    setBusy(true);
    try {
      const body: Record<string, unknown> = { action };
      if (action === "reject") {
        body.reason = "Clinician rejected — draft not appropriate for record";
      }
      if (action === "edit") {
        const editedPayload: StructuredDraftPayload = {
          ...draft.payload,
          title: `${draft.payload.title} (clinician-edited)`,
          sections: [
            ...draft.payload.sections,
            {
              id: "clinician-edit",
              heading: "Clinician edit",
              body: "Edited under HITL — still not an EHR write. Synthetic demo only.",
            },
          ],
        };
        body.editedPayload = editedPayload;
        body.reason = "Edited AI draft before acceptance";
      }
      const res = await fetch(
        `/api/patients/${encodeURIComponent(patientId)}/agent-intelligence/draft/${encodeURIComponent(draft.id)}/decision`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = (await res.json()) as AgentIntelSnapshot & { error?: string };
      if (!res.ok) {
        toast({ title: "Decision failed", description: data.error ?? "Could not decide." });
        return;
      }
      setSnap(data);
      toast({
        title: `Draft ${action}`,
        description: "No EHR write · AI vs verified distinction preserved.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 1100 }}>
      <header style={{ display: "grid", gap: 8 }}>
        <p style={eyebrow}>
          Agent intelligence · Phase 5 · synthetic_demo · not production clinical AI
        </p>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 650, color: "#0f2744" }}>
          {patientLabel ?? snap?.patientLabel ?? patientId}
        </h1>
        <p style={{ margin: 0, color: "#4a6278", maxWidth: 62 * 8, lineHeight: 1.5 }}>
          Governed drafting over shared patient context: history summary, clinical documentation,
          missing-information, evidence-grounded retrieval, and follow-up drafts. Model/prompt
          versions pinned. Accept/Edit/Reject required. ehrWrite stays false.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Button disabled={busy} onClick={() => void postAction({ action: "run_orchestration" })}>
            Run orchestration
          </Button>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => void postAction({ action: "seed_synthetic" })}
          >
            Seed synthetic pack
          </Button>
          <Link href="/dashboard/gp/agent-intelligence">
            <Button variant="outline">GP worklist</Button>
          </Link>
          <Link href={`/dashboard/gp/patients/${patientId}/patient-360`}>
            <Button variant="outline">Patient 360</Button>
          </Link>
          <Link href={`/dashboard/gp/patients/${patientId}/continuous-care`}>
            <Button variant="outline">Continuous care</Button>
          </Link>
        </div>
      </header>

      {loading && <p style={{ color: "#4a6278" }}>Loading…</p>}

      {snap && (
        <>
          <Panel title="Honesty & distinction">
            <p style={bodyText}>{snap.distinctionNote}</p>
            <MetaRow
              items={[
                `capability=${snap.capabilityStatus}`,
                `ehrWrite=${String(snap.ehrWrite)}`,
                `hitlRequired=${String(snap.hitlRequired)}`,
                `clinicalValidationClaim=${String(snap.clinicalValidationClaim)}`,
              ]}
            />
          </Panel>

          <Panel title="Active model / prompt pin">
            <MetaRow
              items={[
                `${snap.activeVersionPin.modelId}@${snap.activeVersionPin.modelVersion}`,
                `${snap.activeVersionPin.promptId}@${snap.activeVersionPin.promptVersion}`,
                `mode=${snap.activeVersionPin.draftingMode}`,
              ]}
            />
            <p style={{ ...bodyText, marginTop: 8 }}>
              Registry pins: {snap.versionRegistry.length} (append-only; no silent bump).
            </p>
          </Panel>

          <Panel title="Shared patient context (no separate silos)">
            <p style={bodyText}>
              {snap.sharedContext.conditions.join("; ") || "No conditions"} · Meds:{" "}
              {snap.sharedContext.medications.join("; ") || "none"}
            </p>
            <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: "#4a6278", fontSize: 13 }}>
              {snap.sharedContext.sources.map((s) => (
                <li key={s.module}>
                  {s.module}: {s.available ? "linked" : "unavailable"} — {s.note}
                </li>
              ))}
            </ul>
            <p style={{ ...bodyText, marginTop: 8 }}>
              Authorised tools: {snap.sharedContext.authorisedTools.join(", ")}
            </p>
          </Panel>

          <Panel title="AI drafts (HITL gate)">
            {snap.drafts.length === 0 ? (
              <p style={bodyText}>No drafts yet — run orchestration.</p>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {snap.drafts.map((d) => (
                  <article key={d.id} style={draftCard}>
                    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8 }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, color: "#0f2744" }}>{d.payload.title}</p>
                        <MetaRow
                          items={[
                            d.kind,
                            `status=${d.status}`,
                            `provenance=${d.provenance}`,
                            `verifiedClinical=${String(d.verifiedClinical)}`,
                            `confidence=${d.confidence}`,
                          ]}
                        />
                      </div>
                      {(d.status === "DRAFT" || d.status === "queued") && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          <Button size="sm" disabled={busy} onClick={() => void decideDraft(d, "accept")}>
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => void decideDraft(d, "edit")}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => void decideDraft(d, "reject")}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                    {d.payload.sections.slice(0, 2).map((s) => (
                      <div key={s.id} style={{ marginTop: 8 }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#2a4a66" }}>
                          {s.heading}
                        </p>
                        <p style={{ ...bodyText, marginTop: 2, whiteSpace: "pre-wrap" }}>{s.body}</p>
                      </div>
                    ))}
                    {d.payload.citations && d.payload.citations.length > 0 && (
                      <p style={{ ...bodyText, marginTop: 8 }}>
                        Citations: {d.payload.citations.map((c) => c.title).join(" · ")}
                      </p>
                    )}
                    <p style={{ ...bodyText, marginTop: 8, fontSize: 12 }}>
                      validation={d.validation.valid ? "pass" : "fail"} · schema=
                      {d.validation.schemaVersion} · pin=
                      {d.versionPin.modelVersion}/{d.versionPin.promptVersion}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Orchestration runs">
            {snap.orchestrationRuns.length === 0 ? (
              <p style={bodyText}>No runs yet.</p>
            ) : (
              snap.orchestrationRuns.map((r) => (
                <div key={r.id} style={{ marginBottom: 8 }}>
                  <MetaRow
                    items={[
                      r.id,
                      r.status,
                      `agents=${r.agentsInvoked.join("+")}`,
                      `llmUsed=${String(r.llmUsed)}`,
                      `drafts=${r.draftIds.length}`,
                    ]}
                  />
                  <p style={{ ...bodyText, marginTop: 4 }}>{r.note}</p>
                </div>
              ))
            )}
          </Panel>

          <Panel title="Evaluation suite (offline)">
            <p style={bodyText}>
              {snap.evalSuite.cases.length} golden cases · last run:{" "}
              {snap.evalSuite.lastResults.filter((r) => r.passed).length}/
              {snap.evalSuite.lastResults.length} passed
            </p>
            <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: "#4a6278", fontSize: 13 }}>
              {snap.evalSuite.lastResults.map((r) => (
                <li key={r.caseId}>
                  {r.caseId}: {r.passed ? "PASS" : `FAIL (${r.failures.join("; ")})`}
                </li>
              ))}
            </ul>
          </Panel>

          {snap.missingData.length > 0 && (
            <Panel title="Missing / pending">
              <ul style={{ margin: 0, paddingLeft: 18, color: "#4a6278", fontSize: 13 }}>
                {snap.missingData.map((m) => (
                  <li key={m.code}>{m.message}</li>
                ))}
              </ul>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={panel}>
      <h2 style={panelTitle}>{title}</h2>
      {children}
    </section>
  );
}

function MetaRow({ items }: { items: string[] }) {
  return (
    <p style={{ margin: "4px 0 0", fontSize: 12, color: "#5a738c", display: "flex", flexWrap: "wrap", gap: 8 }}>
      {items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </p>
  );
}

const eyebrow: CSSProperties = {
  margin: 0,
  fontSize: 12,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "#5a738c",
  fontWeight: 600,
};

const panel: CSSProperties = {
  background: "#fff",
  border: "1px solid #d8e2ec",
  borderRadius: 8,
  padding: 16,
};

const panelTitle: CSSProperties = {
  margin: "0 0 8px",
  fontSize: 15,
  fontWeight: 650,
  color: "#0f2744",
};

const bodyText: CSSProperties = {
  margin: 0,
  fontSize: 14,
  lineHeight: 1.5,
  color: "#4a6278",
};

const draftCard: CSSProperties = {
  border: "1px solid #e2ebf3",
  borderRadius: 6,
  padding: 12,
  background: "#fbfdff",
};
