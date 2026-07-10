import { unlink } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

const baseUrl = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";
const smokeEmail = process.env.SMOKE_LOOP_EMAIL ?? "smoke@akshhealth.com";
const smokePassword = process.env.SMOKE_LOOP_PASSWORD ?? "demo123";
const smokeUserId = process.env.SMOKE_LOOP_USER_ID ?? "user-003";
const projectRoot = process.cwd();

async function cleanupScopeFiles() {
  const targets = [
    `review-cases.${smokeUserId}.json`,
    `feedback-state.${smokeUserId}.json`,
    `benchmark-signoffs.${smokeUserId}.json`,
    `readiness-history.${smokeUserId}.json`
  ];

  await Promise.all(
    targets.map(async (fileName) => {
      try {
        await unlink(path.join(projectRoot, "data", fileName));
      } catch (error) {
        if (error?.code !== "ENOENT") {
          throw error;
        }
      }
    })
  );
}

async function waitForReadyText(page, text, exact = false) {
  await page.getByText(text, { exact }).waitFor({ state: "visible" });
}

async function waitForEnabledTestId(page, testId) {
  await page.waitForFunction(
    (currentTestId) => {
      const element = document.querySelector(`[data-testid="${currentTestId}"]`);
      return element instanceof HTMLButtonElement && !element.disabled;
    },
    testId
  );
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function run() {
  console.log(`Running browser mutation loop smoke against ${baseUrl}`);
  await cleanupScopeFiles();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${baseUrl}/auth/signin?callbackUrl=%2Fintake`, { waitUntil: "networkidle" });
    await page.getByTestId("signin-email").fill(smokeEmail);
    await page.getByTestId("signin-password").fill(smokePassword);
    await page.getByTestId("signin-submit").click();
    await page.waitForURL(/\/intake/);
    await waitForReadyText(page, "Source Intake");
    console.log(`[ok] Signed in and reached intake as ${smokeEmail}`);

    await page.getByTestId("intake-patient-label").fill("Browser Smoke Patient");
    await page.getByTestId("intake-source-input").fill(
      "Stable eczema flare on arms with itching and rash. No infection concerns. Request for hydrocortisone cream repeat."
    );
    await page.getByRole("button", { name: "Create Review Case" }).click();
    await page.waitForURL(/\/cases\/[^/]+$/);
    const createdCaseId = new URL(page.url()).pathname.split("/").filter(Boolean).pop();
    assert(createdCaseId, "Created case route did not include a case id.");
    await waitForReadyText(page, "Reviewer Decision");
    console.log("[ok] Created case through intake UI");

    await page.getByTestId("decision-reviewer-name").fill("Browser Smoke Reviewer");
    const humanGateSaveResponse = page.waitForResponse(
      (response) => response.url().includes(`/api/review-cases/${createdCaseId}`) && response.request().method() === "PUT" && response.ok()
    );
    await page.getByTestId("human-gate-medication_decision-confirm").click();
    await humanGateSaveResponse;
    await page.waitForFunction(() => {
      const element = document.querySelector('[data-testid="human-gate-medication_decision"]');
      return element?.textContent?.includes("completed") && element?.textContent?.includes("Browser Smoke Reviewer");
    });
    console.log("[ok] Confirmed and persisted medication human gate");

    await page.getByTestId("decision-reviewer-notes").fill("Browser-driven loop acceptance.");
    await page.getByTestId("decision-accountability-check").check();
    const saveCaseResponse = page.waitForResponse(
      (response) => response.url().includes("/api/review-cases/") && response.request().method() === "PUT" && response.ok()
    );
    await page.getByTestId("decision-accept").click();
    await saveCaseResponse;
    await waitForReadyText(page, "Accepted Artifact Locked");
    console.log("[ok] Accepted case through reviewer UI");

    await page.reload({ waitUntil: "networkidle" });
    await waitForReadyText(page, "Accepted Artifact Locked");
    await page.waitForFunction(() => {
      const element = document.querySelector('[data-testid="human-gate-medication_decision"]');
      return element?.textContent?.includes("completed") && element?.textContent?.includes("Browser Smoke Reviewer");
    });
    console.log("[ok] Refresh preserved accepted state and human-gate decision");

    await page.getByRole("link", { name: "Open Evidence Page" }).click();
    await page.waitForURL(/\/cases\/[^/]+\/evidence/);
    await page.reload({ waitUntil: "networkidle" });
    await waitForReadyText(page, "Case Evidence Summary", true);
    await page.waitForFunction(() => {
      const element = document.querySelector('[data-testid="case-evidence-artifact-state"]');
      return element?.textContent?.includes("Frozen reviewed artifact");
    });
    await page.getByTestId("synthetic-outcome-capture").waitFor({ state: "visible" });
    await page.waitForFunction(() => {
      const outcome = document.querySelector('[data-testid="synthetic-outcome-capture"]');
      const gate = document.querySelector('[data-testid="human-gate-medication_decision"]');
      return outcome?.textContent?.includes("Medication decision: reviewer_confirmed") &&
        gate?.textContent?.includes("completed") &&
        gate?.textContent?.includes("Browser Smoke Reviewer");
    });
    console.log("[ok] Evidence page preserves human gate and L10 outcome labels after refresh");

    await page.goto(`${baseUrl}/cases/${createdCaseId}/report`, { waitUntil: "networkidle" });
    await waitForReadyText(page, "Case Evidence Report");
    await page.getByTestId("synthetic-outcome-capture").waitFor({ state: "visible" });
    await page.waitForFunction(() => {
      const outcome = document.querySelector('[data-testid="synthetic-outcome-capture"]');
      const gate = document.querySelector('[data-testid="human-gate-medication_decision"]');
      return outcome?.textContent?.includes("Medication decision: reviewer_confirmed") &&
        gate?.textContent?.includes("completed") &&
        gate?.textContent?.includes("Browser Smoke Reviewer");
    });
    console.log("[ok] Printable report preserves human gate and L10 outcome labels");

    const exported = await page.evaluate(async (caseId) => {
      const response = await fetch(`/api/review-cases/${caseId}/export`);
      return {
        ok: response.ok,
        status: response.status,
        payload: await response.json()
      };
    }, createdCaseId);
    assert(exported.ok, `Case export returned ${exported.status}`);
    assert(exported.payload?.artifactState === "frozen", "Case export should return the frozen artifact after acceptance.");
    assert(
      exported.payload?.humanGateDecisions?.some(
        (decision) =>
          decision.id === "medication_decision" &&
          decision.status === "confirmed" &&
          decision.decidedBy === "Browser Smoke Reviewer"
      ),
      "Case export should preserve the confirmed medication human-gate decision."
    );
    assert(
      exported.payload?.outcomeCapture?.reviewerConfirmedActions?.medicationDecision === "reviewer_confirmed",
      "Case export should preserve the L10 medication decision outcome label."
    );
    console.log("[ok] JSON export preserves human gate decisions and L10 outcome labels");

    await page.goto(`${baseUrl}/review/benchmarks/report`, { waitUntil: "networkidle" });
    await waitForReadyText(page, "Benchmark Session Sign-Off");
    await page.getByTestId("benchmark-signoff-reviewer").fill("Browser Smoke Reviewer");
    await page.getByTestId("benchmark-signoff-decision").selectOption("accepted_for_internal_evidence");
    await page.getByTestId("benchmark-signoff-notes").fill("Browser-driven benchmark sign-off.");
    await waitForEnabledTestId(page, "benchmark-signoff-save");
    const saveSignoffResponse = page.waitForResponse(
      (response) => response.url().includes("/api/benchmarks/signoff") && response.request().method() === "POST" && response.ok()
    );
    await page.getByTestId("benchmark-signoff-save").click();
    await saveSignoffResponse;
    await page.getByTestId("benchmark-signoff-latest").waitFor({ state: "visible" });
    await page.waitForFunction(() => {
      const element = document.querySelector('[data-testid="benchmark-signoff-latest"]');
      return element?.textContent?.includes("Accepted for internal evidence");
    });
    console.log("[ok] Saved benchmark sign-off through UI");

    await page.goto(`${baseUrl}/review/readiness`, { waitUntil: "networkidle" });
    await waitForReadyText(page, "Internal Evidence Readiness Gate");
    await page.waitForFunction(() => {
      const element = document.querySelector('[data-testid="readiness-history-count"]');
      return element?.textContent?.includes("1 saved");
    });
    await page.waitForFunction(() => {
      const element = document.querySelector('[data-testid="readiness-benchmark-signoff-summary"]');
      return element?.textContent?.includes("accepted for evidence");
    });
    console.log("[ok] Readiness page reflects saved history and accepted benchmark sign-off");

    console.log(`Browser mutation loop smoke passed for ${baseUrl}`);
  } finally {
    await context.close();
    await browser.close();
    await cleanupScopeFiles();
  }
}

run().catch((error) => {
  console.error("Browser mutation loop smoke failed.");
  console.error(error instanceof Error ? error.message : error);
  console.error("Start the app first with `npm run dev` or `npm run build && npm run start`.");
  process.exit(1);
});
