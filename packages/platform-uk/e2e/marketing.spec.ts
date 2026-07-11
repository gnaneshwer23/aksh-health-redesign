import { expect, test } from "@playwright/test";

test.describe("Marketing smoke", () => {
  test("homepage loads with nav links and visible get started CTA", async ({ page }) => {
    await page.goto("/");

    const nav = page.locator("nav");
    await expect(nav).toHaveAttribute("data-over-dark-hero", "true");
    const brandColor = await page.locator("nav a.navbar-brand").evaluate((element) => window.getComputedStyle(element).color);
    expect(brandColor).toBe("rgb(255, 255, 255)");

    await expect(page.getByRole("heading", { name: /Clinical workflows, one platform/i })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "Platform" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "Demo" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("button", { name: "Solutions" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "Docs" })).toBeVisible();

    const primaryCta = page.getByRole("navigation").getByRole("link", { name: "Get Started" });
    await expect(primaryCta).toBeVisible();

    const opacity = await primaryCta.evaluate((element) => window.getComputedStyle(element).opacity);
    expect(Number(opacity)).toBeGreaterThan(0);
  });

  test("mobile viewport shows hamburger menu with drawer links", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const menuButton = page.getByRole("button", { name: "Open menu" });
    await expect(menuButton).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "Platform" })).toBeHidden();

    await menuButton.click();

    const mobileMenu = page.getByRole("dialog");
    const mobileNav = mobileMenu.getByRole("navigation", { name: "Mobile navigation" });
    await expect(mobileNav.getByRole("link", { name: "Platform" })).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "Demo" })).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "Clinicians" })).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "Practices" })).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "Patients" })).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "Hospitals" })).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "Administrators" })).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "ICS" })).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "Research" })).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "Security" })).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "Integrations" })).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "Docs" })).toBeVisible();
    await expect(mobileMenu.getByRole("link", { name: "Sign In" })).toBeVisible();
    await expect(mobileMenu.getByRole("link", { name: "Get Started" })).toBeVisible();
  });

  test("trust strip shows compliance badges on homepage", async ({ page }) => {
    await page.goto("/");

    const trustStrip = page.getByLabel("Compliance and safety credentials");
    await expect(trustStrip).toBeVisible();
    await expect(trustStrip.getByText("NHS-ready")).toBeVisible();
    await expect(trustStrip.getByText("FHIR R4")).toBeVisible();
    await expect(trustStrip.getByText("Synthetic-safe demo")).toBeVisible();
  });

  test("custom 404 page renders branded message", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");

    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Return home" })).toBeVisible();
  });

  test("audience landing pages load with expected headings", async ({ page }) => {
    await page.goto("/for-clinicians");
    await expect(page.getByRole("heading", { name: /Spend time with patients/i })).toBeVisible();

    await page.goto("/for-practices");
    await expect(page.getByRole("heading", { name: /Run the practice with clear oversight/i })).toBeVisible();

    await page.goto("/for-patients");
    await expect(page.getByRole("heading", { name: /Your health, understood and supported/i })).toBeVisible();

    await page.goto("/for-hospitals");
    await expect(page.getByRole("heading", { name: /Command your hospital/i })).toBeVisible();

    await page.goto("/for-administrators");
    await expect(page.getByRole("heading", { name: /Keep integrations healthy/i })).toBeVisible();

    await page.goto("/for-ics");
    await expect(page.getByRole("heading", { name: /See population health across your integrated care system/i })).toBeVisible();

    await page.goto("/for-research");
    await expect(page.getByRole("heading", { name: /Evaluate outcomes with governed data access/i })).toBeVisible();
  });

  test("security and integrations pages load with expected headings", async ({ page }) => {
    await page.goto("/security");
    await expect(
      page.getByRole("heading", { name: /Data protection and clinical safety for NHS deployments/i })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /GDPR Art\. 9 special category data/i })).toBeVisible();

    await page.goto("/integrations");
    await expect(
      page.getByRole("heading", { name: /Integration-ready architecture for NHS care settings/i })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /FHIR R4 resources/i })).toBeVisible();
  });

  test("demo hub loads with demo cards linking to valid routes", async ({ page }) => {
    await page.goto("/demo");

    await expect(page.getByRole("heading", { name: /See Aksh Health in action/i })).toBeVisible();
    await expect(page.getByText("Synthetic-safe only.")).toBeVisible();

    const patelCard = page.getByRole("link", { name: /Open demo/i }).first();
    await expect(patelCard).toBeVisible();
    await expect(patelCard).toHaveAttribute("href", "/demo/patel");

    const voiceCareLink = page.getByRole("link", { name: /Open demo/i }).nth(1);
    await expect(voiceCareLink).toHaveAttribute("href", "/demo/voice-care-day3");

    await patelCard.click();
    await expect(page).toHaveURL(/\/demo\/patel/);
    await expect(page.getByRole("heading", { name: /Mr James Patel walkthrough/i })).toBeVisible();

    await page.goto("/demo/voice-care-day3");
    await expect(page.getByRole("heading", { name: /Post-consult check-in: Mr James Patel/i })).toBeVisible();
  });
});
