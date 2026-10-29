/**
 * Phase 5 — Diabetes agent intelligence / AI orchestration (synthetic, file-store path).
 * ehrWrite must stay false; no autonomous prescribe/treatment; HITL on drafts;
 * AI vs verified distinction; model/prompt version pins; offline eval suite.
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const tmp = mkdtempSync(path.join(tmpdir(), "agent-intel-phase5-"));
const prevCwd = process.cwd();
const prevDbUrl = process.env.DATABASE_URL;
const prevUsePg = process.env.USE_POSTGRES;
delete process.env.DATABASE_URL;
delete process.env.USE_POSTGRES;
process.chdir(tmp);

async function main() {
  const {
    seedAndBuildAgentIntelligence,
    decideAgentIntelligenceDraft,
    buildAgentIntelligenceWorklist,
    runAgentIntelEvalSuite,
    validateStructuredDraft,
    buildPayloadForKind,
    buildSharedPatientContext,
    ACTIVE_AGENT_INTEL_VERSION,
    AGENT_INTEL_VERSION_REGISTRY,
    formatVersionPin,
    AUTHORISED_AGENT_TOOLS,
  } = await import("../lib/diabetes-intelligence");
  const { capability } = await import("../lib/status/capabilities");

  const scopeKey = `test_${Date.now()}`;
  const patientId = "P002";
  const now = Date.parse("2026-10-29T12:00:00.000Z");

  // --- Shared context (no silos) ---
  const ctx = buildSharedPatientContext(patientId, { now });
  assert.equal(ctx.synthetic, true);
  assert.equal(ctx.ehrWrite, false);
  assert.ok(ctx.conditions.some((c) => /diabetes/i.test(c)));
  assert.ok(ctx.sources.some((s) => s.module === "patient_360" && s.available));
  assert.ok(ctx.sources.some((s) => s.module === "agents_register" && s.available));
  for (const tool of AUTHORISED_AGENT_TOOLS) {
    assert.ok(ctx.authorisedTools.includes(tool), `authorised tool ${tool}`);
  }

  // --- Version registry ---
  assert.ok(AGENT_INTEL_VERSION_REGISTRY.length >= 2);
  assert.equal(ACTIVE_AGENT_INTEL_VERSION.draftingMode, "deterministic_synthetic");
  assert.ok(formatVersionPin(ACTIVE_AGENT_INTEL_VERSION).includes("synth-det-1.0.0"));

  // --- Structured validation ---
  const good = buildPayloadForKind("clinical_documentation", ctx);
  assert.equal(validateStructuredDraft(good).valid, true);
  const bad = { ...good, soap: undefined };
  assert.equal(validateStructuredDraft(bad).valid, false);

  // --- Orchestration seed ---
  let snap = await seedAndBuildAgentIntelligence(patientId, {
    scopeKey,
    now,
    actor: "clinician@aksh.health",
  });

  assert.equal(snap.synthetic, true);
  assert.equal(snap.ehrWrite, false);
  assert.equal(snap.hitlRequired, true);
  assert.equal(snap.autonomousClinicalAction, false);
  assert.equal(snap.clinicalValidationClaim, false);
  assert.equal(snap.capabilityStatus, "synthetic_demo");
  assert.ok(snap.distinctionNote.toLowerCase().includes("ai-generated"));

  assert.equal(snap.drafts.length, 5);
  const kinds = new Set(snap.drafts.map((d) => d.kind));
  for (const k of [
    "history_summary",
    "clinical_documentation",
    "missing_information",
    "evidence_retrieval",
    "follow_up_draft",
  ] as const) {
    assert.ok(kinds.has(k), `draft kind ${k}`);
  }

  for (const d of snap.drafts) {
    assert.equal(d.status, "DRAFT");
    assert.equal(d.provenance, "ai_generated");
    assert.equal(d.verifiedClinical, false);
    assert.equal(d.ehrWrite, false);
    assert.equal(d.autonomousClinicalAction, false);
    assert.equal(d.prescribeOrTreat, false);
    assert.equal(d.hitlRequired, true);
    assert.equal(d.validation.valid, true);
    assert.equal(d.versionPin.modelVersion, ACTIVE_AGENT_INTEL_VERSION.modelVersion);
    assert.equal(d.versionPin.promptVersion, ACTIVE_AGENT_INTEL_VERSION.promptVersion);
  }

  const evidence = snap.drafts.find((d) => d.kind === "evidence_retrieval");
  assert.ok(evidence?.payload.citations && evidence.payload.citations.length > 0);

  const missing = snap.drafts.find((d) => d.kind === "missing_information");
  assert.ok(missing?.payload.missingFields && missing.payload.missingFields.length > 0);

  assert.ok(snap.orchestrationRuns.length >= 1);
  assert.equal(snap.orchestrationRuns[0]?.llmUsed, false);
  assert.equal(snap.orchestrationRuns[0]?.ehrWrite, false);

  // --- HITL reject without reason fails ---
  const draft = snap.drafts.find((d) => d.kind === "history_summary");
  assert.ok(draft);
  let rejected = false;
  try {
    await decideAgentIntelligenceDraft(
      {
        patientId,
        draftId: draft!.id,
        action: "reject",
        actor: "clinician@aksh.health",
      },
      { scopeKey }
    );
  } catch {
    rejected = true;
  }
  assert.equal(rejected, true, "reject without reason fails");

  // --- Accept → clinician_verified ---
  snap = await decideAgentIntelligenceDraft(
    {
      patientId,
      draftId: draft!.id,
      action: "accept",
      actor: "clinician@aksh.health",
      reason: "Accepted summary for care coordination — synthetic",
    },
    { scopeKey }
  );
  const accepted = snap.drafts.find((d) => d.id === draft!.id);
  assert.equal(accepted?.status, "accepted");
  assert.equal(accepted?.verifiedClinical, true);
  assert.equal(accepted?.provenance, "clinician_verified");
  assert.equal(accepted?.ehrWrite, false);

  // --- Edit requires payload ---
  const doc = snap.drafts.find((d) => d.kind === "clinical_documentation" && d.status === "DRAFT");
  assert.ok(doc);
  let editFailed = false;
  try {
    await decideAgentIntelligenceDraft(
      {
        patientId,
        draftId: doc!.id,
        action: "edit",
        actor: "clinician@aksh.health",
      },
      { scopeKey }
    );
  } catch {
    editFailed = true;
  }
  assert.equal(editFailed, true, "edit without editedPayload fails");

  snap = await decideAgentIntelligenceDraft(
    {
      patientId,
      draftId: doc!.id,
      action: "edit",
      actor: "clinician@aksh.health",
      reason: "Edited SOAP plan wording",
      editedPayload: {
        ...doc!.payload,
        title: `${doc!.payload.title} (edited)`,
        sections: [
          ...doc!.payload.sections,
          {
            id: "edit-note",
            heading: "Clinician edit",
            body: "Adjusted plan wording — still draft artifact only.",
          },
        ],
      },
    },
    { scopeKey }
  );
  assert.equal(snap.drafts.find((d) => d.id === doc!.id)?.status, "edited");
  assert.equal(snap.drafts.find((d) => d.id === doc!.id)?.verifiedClinical, true);

  // --- Reject ---
  const fu = snap.drafts.find((d) => d.kind === "follow_up_draft" && d.status === "DRAFT");
  assert.ok(fu);
  snap = await decideAgentIntelligenceDraft(
    {
      patientId,
      draftId: fu!.id,
      action: "reject",
      actor: "clinician@aksh.health",
      reason: "Follow-up timing not appropriate",
    },
    { scopeKey }
  );
  assert.equal(snap.drafts.find((d) => d.id === fu!.id)?.status, "rejected");
  assert.equal(snap.drafts.find((d) => d.id === fu!.id)?.verifiedClinical, false);

  // --- Worklist ---
  const list = await buildAgentIntelligenceWorklist({ scopeKey });
  assert.ok(list.every((i) => i.ehrWrite === false));
  assert.ok(list.every((i) => i.provenance === "ai_generated"));
  assert.ok(list.some((i) => i.patientId === patientId));

  // --- Offline eval suite ---
  const results = runAgentIntelEvalSuite({ now });
  assert.ok(results.length >= 2);
  for (const r of results) {
    assert.equal(r.synthetic, true);
    assert.equal(r.passed, true, `${r.caseId} failures: ${r.failures.join("; ")}`);
  }

  // --- Capability honesty ---
  const cap = capability("diabetes_agent_intelligence");
  assert.equal(cap.status, "synthetic_demo");
  assert.ok(cap.evidence.includes("tests/diabetes-agent-intelligence.test.ts"));

  console.log("diabetes-agent-intelligence: PASS");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    process.chdir(prevCwd);
    if (prevDbUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = prevDbUrl;
    if (prevUsePg === undefined) delete process.env.USE_POSTGRES;
    else process.env.USE_POSTGRES = prevUsePg;
    rmSync(tmp, { recursive: true, force: true });
  });
