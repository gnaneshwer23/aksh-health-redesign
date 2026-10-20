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
    const ok = await request.post("/api/audit/shield", { data: { action: "accept", label: "Acknowledged GUARDIAN brief", agentLabel: "GUARDIAN", caseId: mine.id, category: "reviewer_decision" } });
    expect(ok.ok(), await ok.text()).toBeTruthy();
    const row = ((await ok.json()) as { event: { actor: string; practiceId: string | null } }).event;
    expect(row.actor).toBe(owner.email);
    expect(row.practiceId).toBeTruthy();
    expect((await request.post("/api/audit/shield", { data: { action: "accept", label: "x", agentLabel: "SUPERVISOR_ROOT" } })).status()).toBe(400);
    expect((await request.post("/api/audit/shield", { data: { action: "approve_prescription", label: "x" } })).status()).toBe(400);

    // Another user cannot write into this user's case.
    const other = await playwright.request.newContext({ baseURL });
    await createOnboardedTestUser(other, baseURL!, { role: "gp", label: "audit-other" });
    const forged = await other.post("/api/audit/shield", { data: { action: "accept", label: "Forged decision", agentLabel: "CONDUCTOR", caseId: mine.id } });
    expect(forged.status()).toBe(403);
    await other.dispose();
  });
});
