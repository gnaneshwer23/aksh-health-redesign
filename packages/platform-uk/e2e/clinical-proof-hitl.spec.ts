import { expect, test } from "@playwright/test";

import { applyApiCookiesToPage, createOnboardedTestUser } from "./helpers/auth";

/**
 * HITL non-bypass suite — proves draft ≠ record and write paths stay gated.
 * Live EMIS write-back is asserted as disabled (BLOCKED: partner), never fake-passed.
 */
test.describe("Clinical proof — HITL non-bypass", () => {
  test("unauthenticated write attempts fail", async ({ request }) => {
    const emis = await request.post("/api/integrations/emis-staging", {
      data: { bundleSummary: "bypass attempt" },
    });
    expect(emis.status()).toBe(401);

    const sim = await request.post("/api/integrations/ehr-writeback-sim", {
      data: { action: "write", resourceSummary: "bypass" },
    });
    expect(sim.status()).toBe(401);

    const shield = await request.post("/api/audit/shield", {
      data: { label: "bypass audit" },
    });
    expect(shield.status()).toBe(401);

    const guardian = await request.post("/api/agents/guardian", {
      data: { patientId: "P002", proposedDrug: "Apixaban" },
    });
    expect(guardian.status()).toBe(401);
  });

  test("authenticated agent drafts never claim EHR write; EHR staging is no-write", async ({
    request,
    baseURL,
  }) => {
    await createOnboardedTestUser(request, baseURL!, { role: "gp", label: "hitl-api" });

    const guardian = await request.post("/api/agents/guardian", {
      data: { patientId: "P002", proposedDrug: "Apixaban" },
    });
    expect(guardian.ok()).toBeTruthy();
    const guardianBody = (await guardian.json()) as {
      hitlRequired?: boolean;
      ehrWrite?: boolean;
      draft?: { overallStatus?: string };
    };
    expect(guardianBody.ehrWrite).toBe(false);
    expect(guardianBody.hitlRequired).toBe(true);
    expect(guardianBody.draft).toBeTruthy();

    const oracle = await request.post("/api/agents/oracle", {
      data: { patientId: "P002" },
    });
    expect(oracle.ok()).toBeTruthy();
    const oracleBody = (await oracle.json()) as { ehrWrite?: boolean; hitlRequired?: boolean };
    expect(oracleBody.ehrWrite).toBe(false);
    expect(oracleBody.hitlRequired).toBe(true);

    const emisGet = await request.get("/api/integrations/emis-staging");
    expect(emisGet.ok()).toBeTruthy();
    const emisStatus = (await emisGet.json()) as { liveWriteBack?: boolean; enabled?: boolean };
    expect(emisStatus.liveWriteBack).toBe(false);
    expect(emisStatus.enabled).toBe(false);

    const emisPost = await request.post("/api/integrations/emis-staging", {
      data: { caseId: "proof", bundleSummary: "HITL-approved synthetic bundle" },
    });
    expect(emisPost.ok()).toBeTruthy();
    const emisBody = (await emisPost.json()) as {
      liveWriteBack?: boolean;
      entry?: { ehrWriteAttempted?: boolean };
      message?: string;
    };
    expect(emisBody.liveWriteBack).toBe(false);
    expect(emisBody.entry?.ehrWriteAttempted).toBe(false);
    expect(emisBody.message).toMatch(/No (EMIS|EHR) write/i);
  });

  test("Accept → FHIR stage → approval token → sim write once; reject never writes; replay denied", async ({
    request,
    baseURL,
  }) => {
    await createOnboardedTestUser(request, baseURL!, { role: "gp", label: "ehr-sim-chain" });

    // Unauthenticated already covered; authenticated missing-token must still fail
    const denied = await request.post("/api/integrations/ehr-writeback-sim", {
      data: { action: "write", resourceSummary: "no token" },
    });
    expect([401, 403]).toContain(denied.status());
    const deniedBody = (await denied.json()) as { liveEmis?: boolean; liveWriteBack?: boolean };
    expect(deniedBody.liveEmis ?? false).toBe(false);
    expect(deniedBody.liveWriteBack ?? false).toBe(false);

    // Accept → internal FHIR staging (no live EMIS)
    const stagedSummary =
      "HITL Accept FHIR R4 Bundle (DocumentReference, Condition, Flag, Observation, Encounter, AuditEvent)";
    const emisPost = await request.post("/api/integrations/emis-staging", {
      data: {
        caseId: "proof-accept-chain",
        bundleSummary: stagedSummary,
      },
    });
    expect(emisPost.ok()).toBeTruthy();
    const emisBody = (await emisPost.json()) as {
      liveWriteBack?: boolean;
      entry?: { id?: string; ehrWriteAttempted?: boolean };
    };
    expect(emisBody.liveWriteBack).toBe(false);
    expect(emisBody.entry?.ehrWriteAttempted).toBe(false);
    expect(emisBody.entry?.id).toBeTruthy();

    // Approval token only after Accept/staging
    const issued = await request.post("/api/integrations/ehr-writeback-sim", {
      data: {
        action: "issue-approval",
        resourceSummary: stagedSummary,
        caseId: "proof-accept-chain",
        queueItemId: emisBody.entry?.id,
      },
    });
    expect(issued.ok()).toBeTruthy();
    const issuedBody = (await issued.json()) as {
      approval?: { token?: string };
      liveEmis?: boolean;
    };
    expect(issuedBody.liveEmis).toBe(false);
    const token = issuedBody.approval?.token;
    expect(token).toBeTruthy();

    const allowed = await request.post("/api/integrations/ehr-writeback-sim", {
      data: {
        action: "write",
        approvalToken: token,
        resourceSummary: stagedSummary,
      },
    });
    expect(allowed.ok()).toBeTruthy();
    const writeBody = (await allowed.json()) as {
      write?: { liveEmis?: boolean };
      liveWriteBack?: boolean;
      message?: string;
    };
    expect(writeBody.write?.liveEmis).toBe(false);
    expect(writeBody.liveWriteBack).toBe(false);
    expect(writeBody.message).toMatch(/BLOCKED: partner|Simulated write/i);

    const replay = await request.post("/api/integrations/ehr-writeback-sim", {
      data: { action: "write", approvalToken: token },
    });
    expect(replay.status()).toBe(409);

    // Reject never reaches sim: no approval token issued → write fails
    const rejectWrite = await request.post("/api/integrations/ehr-writeback-sim", {
      data: {
        action: "write",
        resourceSummary: "Rejected draft must not write",
        approvalToken: "hitl-approve-rejected-never-issued",
      },
    });
    expect([401, 403]).toContain(rejectWrite.status());
  });

  test("public GP demo never claims a SHIELD audit or a real reviewer without a session", async ({ page }) => {
    // SC-1 / SC-3: an unauthenticated Accept is a demo action. The UI must say so, must not
    // send the audit write, and must not attribute the decision to a named clinician.
    const shieldPosts: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/api/audit/shield") && req.method() === "POST") shieldPosts.push(req.url());
    });

    await page.goto("/dashboard/gp");
    const accept = page.getByRole("button", { name: /Accept AI output/i }).first();
    await expect(accept).toBeVisible({ timeout: 20_000 });
    await accept.click();

    await expect(page.getByText(/Demo only, not audited/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/SHIELD logged/i)).toHaveCount(0);
    await expect(page.getByText(/Dr Morgan/i)).toHaveCount(0);
    expect(shieldPosts, "no audit write should be attempted without a session").toEqual([]);
  });

  test("GP review queue Accept / Edit / Reject updates UI audit trail (demo record ≠ EHR)", async ({
    page,
    request,
    baseURL,
  }) => {
    await createOnboardedTestUser(request, baseURL!, { role: "gp", label: "hitl-ui" });
    await applyApiCookiesToPage(page, request);
    await page.goto("/dashboard/gp/review-queue");
    await expect(page.getByTestId("gp-review-queue")).toBeVisible();

    const pendingCard = page.locator("[data-review-item], article, .rounded-lg").filter({
      has: page.getByRole("button", { name: /Accept AI output/i }),
    }).first();

    // Prefer explicit Accept aria-label from HitlActions
    const acceptBtn = page.getByRole("button", { name: /Accept AI output/i }).first();
    await expect(acceptBtn).toBeVisible({ timeout: 15_000 });

    // Edit path on a pending item
    const editBtn = page.getByRole("button", { name: /Edit AI output/i }).first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      const editor = page.getByRole("textbox", { name: /Edit AI output/i });
      await expect(editor).toBeVisible();
      await editor.fill("Clinician-edited SOAP note for clinical proof harness.");
      await page.getByRole("button", { name: /Save edit/i }).click();
      await expect(page.getByText(/Edit saved|Edited|re-acceptance/i).first()).toBeVisible({
        timeout: 10_000,
      });
    }

    // Accept (demo local written-to-record — not EMIS)
    await page.getByRole("button", { name: /Accept AI output|Accept edited/i }).first().click();
    await expect(page.getByText(/Accepted/i).first()).toBeVisible({ timeout: 10_000 });

    // Reject another pending item if present
    const rejectBtn = page.getByRole("button", { name: /Reject AI output/i }).first();
    if (await rejectBtn.isVisible()) {
      await rejectBtn.click();
      const confirm = page.getByRole("button", { name: /Confirm reject/i });
      await expect(confirm).toBeVisible();
      await confirm.click();
      await expect(page.getByText(/Rejected/i).first()).toBeVisible({ timeout: 10_000 });
    }

    // Prove EMIS still no-write after UI HITL
    const emis = await request.get("/api/integrations/emis-staging");
    const emisJson = (await emis.json()) as { liveWriteBack?: boolean };
    expect(emisJson.liveWriteBack).toBe(false);

    void pendingCard;
  });
});
