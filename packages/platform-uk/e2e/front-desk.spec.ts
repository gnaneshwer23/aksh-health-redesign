import { expect, test, type Page } from "@playwright/test";

/**
 * Front Desk + Asha (docs/PATIENT_ACCESS_AND_ASHA.md). Public synthetic demo:
 * conversations and admin bookings work without sign-in; clinical decisions and call
 * approvals do not.
 */

async function talk(page: Page, scope: ReturnType<Page["locator"]>, text: string) {
  const box = scope.getByRole("textbox", { name: "Your reply" });
  await box.fill(text);
  await scope.getByRole("button", { name: "Send" }).click();
  await expect(scope.getByText(text, { exact: true }).last()).toBeVisible();
}

test.describe("Front Desk and Asha", () => {
  test("inbound call books an appointment and a health update reaches GP review", async ({ page }) => {
    await page.goto("/dashboard/front-desk");
    await expect(page.getByRole("heading", { name: "Front Desk", level: 1 })).toBeVisible();
    await expect(page.getByText(/Synthetic patients · simulated telephony · no EHR write/)).toBeVisible();

    const asha = page.locator("[data-asha]").last();
    await asha.getByRole("button", { name: "Call the practice" }).click();
    await expect(asha.getByText(/I’m Asha/)).toBeVisible();
    await expect(asha.getByText(/call 999/)).toBeVisible();

    await talk(page, asha, "I'd like to book a blood test");
    await talk(page, asha, "James Patel, 22/11/1971");
    await expect(asha.getByText(/blood test times/)).toBeVisible();
    await talk(page, asha, "the first one");
    await expect(asha.getByText(/^Done\. You’re/)).toBeVisible();

    await talk(page, asha, "I want to give an update, my sugars have been 12 to 14 and I'm very thirsty");
    await talk(page, asha, "that's all");
    await expect(asha.getByText(/clinician will review it/)).toBeVisible();

    await page.getByRole("button", { name: "Refresh" }).click();
    const drafts = page.locator("[data-drafts]");
    await expect(drafts.getByText("12–14 mmol/L").first()).toBeVisible();
    await page.getByRole("tab", { name: /Resolved by Asha/ }).click();
    await expect(page.locator("[data-queue]").getByText(/Patel booked blood test/).first()).toBeVisible();
  });

  test("emergency mid-call goes straight to 999 and the team", async ({ page }) => {
    await page.goto("/asha");
    const asha = page.locator("[data-asha]");
    await asha.getByRole("button", { name: "Call the practice" }).click();
    await talk(page, asha, "I've got crushing chest pain");
    await expect(asha.getByText(/Please call 999 now/)).toBeVisible();
    await expect(asha.getByText("Passed to the practice team").first()).toBeVisible();
  });

  test("campaign approval needs a signed-in clinician; referral desk proposes a slot", async ({ page }) => {
    await page.goto("/dashboard/front-desk");
    await page.getByRole("button", { name: /Health check-ins/ }).click();
    const campaign = page.locator('[data-campaign="health_check_in"]').first();
    await expect(campaign).toBeVisible();
    await campaign.getByRole("button", { name: "Approve" }).click();
    await expect(page.getByText(/Sign in as a GP or practice manager to approve calls/).first()).toBeVisible();
    await expect(campaign.getByText("draft", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Use sample letter" }).click();
    await page.getByRole("button", { name: "Process referral" }).click();
    await expect(page.getByText(/Proposed: /).first()).toBeVisible();
  });

  test("patient-facing Asha page states its limits", async ({ page }) => {
    await page.goto("/asha");
    await expect(page.getByRole("heading", { name: "Talk to Asha." })).toBeVisible();
    await expect(page.getByText(/never gives medical advice/).first()).toBeVisible();
    await expect(page.getByText(/Everything is marked patient-reported and unverified/)).toBeVisible();
  });
});
