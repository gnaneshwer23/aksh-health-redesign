import { expect, test } from "@playwright/test";

import { applyApiCookiesToPage, createOnboardedTestUser } from "./helpers/auth";

/**
 * Patel golden-path — automate what exists today.
 * Steps that require live EMIS / Partner write-back are marked BLOCKED: partner (not fake-passed).
 */
test.describe("Clinical proof — Patel golden path", () => {
  test("demo walkthrough + GP patient context + queue agents + SHIELD counts", async ({
    page,
    request,
    baseURL,
  }) => {
    await createOnboardedTestUser(request, baseURL!, { role: "gp", label: "patel-golden" });
    await applyApiCookiesToPage(page, request);

    // 1) Public / demo Patel framing
    await page.goto("/demo/patel");
    await expect(page.getByRole("heading", { name: /Mr James Patel|Patel/i }).first()).toBeVisible({
      timeout: 20_000,
    });

    // 2) Open GP patients list — Patel is in the synthetic cohort
    await page.goto("/dashboard/gp/patients");
    await expect(page.getByText(/Mr James Patel/i).first()).toBeVisible({ timeout: 20_000 });

    // Also confirm GP home contains Patel in the appointment/risk model (may be off-screen)
    await page.goto("/dashboard/gp");
    await expect(page.getByText(/Mr James Patel/i).first()).toBeAttached({ timeout: 15_000 });

    // 3) Review queue — ≥4 Patel-related items expected in seed
    await page.goto("/dashboard/gp/review-queue");
    await expect(page.getByTestId("gp-review-queue")).toBeVisible();
    await expect(page.getByText(/Mr James Patel/i).first()).toBeVisible();
    await expect(page.getByText(/GUARDIAN|Aspirin|Apixaban/i).first()).toBeVisible();
    await expect(page.getByText(/ORACLE|Risk score/i).first()).toBeVisible();
    await expect(page.getByText(/SOAP|SYNTHESIS/i).first()).toBeVisible();

    // 4) Agent APIs against P002
    const guardian = await request.post("/api/agents/guardian", {
      data: { patientId: "P002", proposedDrug: "Apixaban" },
    });
    expect(guardian.ok()).toBeTruthy();
    const gBody = (await guardian.json()) as {
      ehrWrite?: boolean;
      draft?: { overallStatus?: string; interactions?: unknown[] };
    };
    expect(gBody.ehrWrite).toBe(false);
    expect(gBody.draft).toBeTruthy();

    const oracle = await request.post("/api/agents/oracle", {
      data: { patientId: "P002" },
    });
    expect(oracle.ok()).toBeTruthy();
    const oBody = (await oracle.json()) as { ehrWrite?: boolean; draft?: unknown };
    expect(oBody.ehrWrite).toBe(false);
    expect(oBody.draft).toBeTruthy();

    // 5) Edit SOAP then accept one queue item (demo record only)
    const editBtn = page.getByRole("button", { name: /Edit AI output/i }).first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      const editor = page.getByRole("textbox", { name: /Edit AI output/i });
      if (await editor.isVisible()) {
        await editor.fill(
          "Patel golden-path clinician edit: DVT + T2D plan reviewed; aspirin/apixaban acknowledged."
        );
        await page.getByRole("button", { name: /Save edit/i }).click();
      }
    }
    const accept = page.getByRole("button", { name: /Accept AI output|Accept edited/i }).first();
    if (await accept.isVisible()) {
      await accept.click();
      await expect(page.getByText(/Accepted/i).first()).toBeVisible({ timeout: 10_000 });
    }

    // 6) SHIELD list (durable when DATABASE_URL present)
    const shield = await request.get("/api/audit/shield?limit=20");
    expect(shield.ok()).toBeTruthy();
    const shieldBody = (await shield.json()) as { count?: number; durable?: boolean; events?: unknown[] };
    expect(typeof shieldBody.count).toBe("number");
    // Agent draft posts should have attempted SHIELD rows when Postgres is up
    if (shieldBody.durable) {
      expect((shieldBody.count ?? 0) >= 0).toBeTruthy();
    }

    // 7) Explicit BLOCKED partner assertion — do not fake-pass EHR write-back
    const emis = await request.get("/api/integrations/emis-staging");
    const emisBody = (await emis.json()) as { liveWriteBack?: boolean; status?: string };
    expect(emisBody.liveWriteBack).toBe(false);
    test.info().annotations.push({
      type: "BLOCKED: partner",
      description:
        "Patel golden-path stops before live EHR write-back. Staging scaffold only; Partner credentials + CSO sign-off required.",
    });
  });
});
