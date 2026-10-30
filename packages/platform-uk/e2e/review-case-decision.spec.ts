import { expect, test } from "@playwright/test";

import { applyApiCookiesToPage, createOnboardedTestUser } from "./helpers/auth";
import type { ReviewCase } from "../lib/types";

/**
 * Case-level and human-gate decisions go through the server (P0 remainder). The generic save refuses them, decisions
 * record the signed-in account, a required gate and open blockers stop acceptance with their reasons, and an accepted
 * case is final.
 */
test.describe("Review case decisions on the server", () => {
  test("gate, blockers, accept, final — and the generic save cannot change a decision", async ({ request, baseURL }) => {
    test.setTimeout(90_000);
    const user = await createOnboardedTestUser(request, baseURL!, { role: "gp", label: "case-decision" });
    const create = async (rawInput: string, options?: Record<string, unknown>) => {
      const r = await request.post("/api/review-cases", { data: { action: "create", patientLabel: "Synthetic patient", rawInput, sourceType: "note", options } });
      expect(r.status()).toBe(201);
      return ((await r.json()) as { reviewCase: ReviewCase }).reviewCase;
    };
    const gated = await create("Known penicillin allergy. Plan: start amoxicillin 500mg three times daily for chest infection.", { includeMedicationDraft: true });
    const clean = await create("Care plan review after therapy optimisation. Accept recommendation for follow-up HbA1c.");

    // The generic save refuses a status change.
    const sneaky = await request.put(`/api/review-cases/${clean.id}`, { data: { ...clean, status: "accepted" } });
    expect(sneaky.status(), await sneaky.text()).toBe(409);
    expect(((await sneaky.json()) as { code: string }).code).toBe("USE_DECISION_ENDPOINT");

    // A required medication gate (and other blockers) stop acceptance, with the reasons.
    const blocked = await request.post(`/api/review-cases/${gated.id}/decision`, { data: { decision: "accept", acknowledged: true, expectedVersion: gated.version ?? 0 } });
    expect(blocked.status()).toBe(409);
    const blockedBody = (await blocked.json()) as { code: string; blockers: string[] };
    expect(blockedBody.code).toBe("BLOCKED");
    expect(blockedBody.blockers.some((b) => /Medication\/decision gate/.test(b))).toBeTruthy();

    // The gate decision is recorded under the signed-in account; replaying the old version is refused.
    const gate = await request.post(`/api/review-cases/${gated.id}/gates/medication_decision`, { data: { status: "confirmed", note: "Allergy checked", expectedVersion: gated.version ?? 0 } });
    expect(gate.ok(), await gate.text()).toBeTruthy();
    expect(((await gate.json()) as { outcome: { decidedBy: string } }).outcome.decidedBy).toBe(user.email);
    const stale = await request.post(`/api/review-cases/${gated.id}/gates/medication_decision`, { data: { status: "open", expectedVersion: gated.version ?? 0 } });
    expect(stale.status()).toBe(409);

    // Accepting needs the accountability acknowledgement; then accepted under the signed-in account, staged (simulation), final.
    const noAck = await request.post(`/api/review-cases/${clean.id}/decision`, { data: { decision: "accept", acknowledged: false, expectedVersion: clean.version ?? 0 } });
    expect(noAck.status()).toBe(400);
    const accept = await request.post(`/api/review-cases/${clean.id}/decision`, { data: { decision: "accept", acknowledged: true, notes: "Reviewed in full", expectedVersion: clean.version ?? 0 } });
    expect(accept.ok(), await accept.text()).toBeTruthy();
    const acceptBody = (await accept.json()) as { reviewCase: ReviewCase; outcome: { decidedBy: string; auditDurable: boolean }; staging: { status: string; liveRecordWrite: boolean } };
    expect(acceptBody.reviewCase.status).toBe("accepted");
    expect(acceptBody.reviewCase.frozenArtifact).toBeTruthy();
    expect(acceptBody.outcome.decidedBy).toBe(user.email);
    expect(acceptBody.staging.liveRecordWrite).toBe(false);
    expect(["staged", "failed"]).toContain(acceptBody.staging.status);
    const again = await request.post(`/api/review-cases/${clean.id}/decision`, { data: { decision: "reject", acknowledged: false, expectedVersion: acceptBody.reviewCase.version } });
    expect(again.status()).toBe(409);
  });

  test("case screen: blocked accept shows the reason; accept records the signed-in account", async ({ page, request, baseURL }) => {
    test.setTimeout(90_000);
    const user = await createOnboardedTestUser(request, baseURL!, { role: "gp", label: "case-screen" });
    await applyApiCookiesToPage(page, request);
    const make = async (rawInput: string, options?: Record<string, unknown>) =>
      ((await (await request.post("/api/review-cases", { data: { action: "create", patientLabel: "Synthetic patient", rawInput, sourceType: "note", options } })).json()) as { reviewCase: ReviewCase }).reviewCase;
    const gated = await make("Known penicillin allergy. Plan: start amoxicillin 500mg three times daily for chest infection.", { includeMedicationDraft: true });
    const clean = await make("Care plan review after therapy optimisation. Accept recommendation for follow-up HbA1c.");

    await page.goto(`/cases/${gated.id}`);
    await page.getByTestId("decision-accountability-check").check();
    await page.getByTestId("decision-accept").click();
    await expect(page.getByText(/requires an override reason|still requires an explicit reviewer decision|Reviewer checklist is incomplete/).first()).toBeVisible({ timeout: 20_000 });

    await page.goto(`/cases/${clean.id}`);
    await expect(page.getByTestId("decision-reviewer-name")).toContainText("signed-in account");
    await page.getByTestId("decision-accountability-check").check();
    await page.getByTestId("decision-accept").click();
    await expect(page.getByTestId("decision-accept")).toBeDisabled({ timeout: 20_000 });
    const stored = ((await (await request.get(`/api/review-cases/${clean.id}`)).json()) as { reviewCase: ReviewCase }).reviewCase;
    expect(stored.status).toBe("accepted");
    expect(stored.reviewSummary?.lastReviewer).toBe(user.email);
  });

  test("panel audit events: server identity and practice; cannot forge an agent, an action or another user's case", async ({ request, baseURL, playwright }) => {
    const owner = await createOnboardedTestUser(request, baseURL!, { role: "gp", label: "audit-owner" });
    const mine = ((await (await request.post("/api/review-cases", { data: { action: "create", patientLabel: "Synthetic patient", rawInput: "Routine diabetes review.", sourceType: "note" } })).json()) as { reviewCase: ReviewCase }).reviewCase;
    const ok = await request.post("/api/audit/shield", { data: { event: "staged", subject: "interaction_alert", action: "accept", agent: "GUARDIAN", caseId: mine.id, note: "Checked allergy list" } });
    expect(ok.ok(), await ok.text()).toBeTruthy();
    const row = ((await ok.json()) as { event: { actor: string; practiceId: string | null; label: string; detail: string } }).event;
    expect(row.actor).toBe(owner.email);
    expect(row.practiceId).toBeTruthy();
    expect(row.label).toBe("SHIELD: GUARDIAN medication interaction alert staged for clinician review");
    expect(row.detail).toBe("Checked allergy list");
    // Free-text wording is refused: the server writes it.
    const free = await request.post("/api/audit/shield", { data: { label: "Dr X approved the prescription", event: "decided", subject: "draft", action: "accept" } });
    expect(free.status()).toBe(400);
    expect(((await free.json()) as { code: string }).code).toBe("LABEL_NOT_ACCEPTED");
    expect((await request.post("/api/audit/shield", { data: { event: "decided", subject: "draft", action: "accept", agent: "SUPERVISOR_ROOT" } })).status()).toBe(400);
    expect((await request.post("/api/audit/shield", { data: { event: "decided", subject: "draft", action: "approve_prescription" } })).status()).toBe(400);
    expect((await request.post("/api/audit/shield", { data: { event: "deleted", subject: "draft", action: "accept" } })).status()).toBe(400);

    // Another user cannot write into this user's case.
    const other = await playwright.request.newContext({ baseURL });
    await createOnboardedTestUser(other, baseURL!, { role: "gp", label: "audit-other" });
    const forged = await other.post("/api/audit/shield", { data: { event: "decided", subject: "draft", action: "accept", agent: "CONDUCTOR", caseId: mine.id } });
    expect(forged.status()).toBe(403);
    await other.dispose();
  });

  test("release readiness: measured on the loop, proposed targets, no agent ready", async ({ request, baseURL }) => {
    await createOnboardedTestUser(request, baseURL!, { role: "gp", label: "readiness" });
    const r = await request.get("/api/agents/readiness");
    expect(r.ok(), await r.text()).toBeTruthy();
    const body = (await r.json()) as { agents: { id: string; ready: boolean; criteria: { name: string }[] }[] };
    const synthesis = body.agents.find((a) => a.id === "SYNTHESIS")!;
    expect(synthesis.criteria.map((c) => c.name)).toContain("Rejection rate");
    expect(body.agents.every((a) => !a.ready)).toBeTruthy();
    // P4: PRISM/ATLAS appear on the readiness board as scaffolds but remain not ready.
    const phase2 = body.agents.filter((a) => a.id === "PRISM" || a.id === "ATLAS");
    expect(phase2).toHaveLength(2);
    expect(phase2.every((a) => !a.ready)).toBeTruthy();
  });
});
