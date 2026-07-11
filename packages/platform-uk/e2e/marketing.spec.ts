import { expect, test } from "@playwright/test";

test.describe("Marketing smoke", () => {
  test("homepage loads with nav links and visible get started CTA", async ({ page }) => {
    await page.goto("/");

    const nav = page.locator("nav[data-over-dark-hero]");
    await expect(nav).toHaveAttribute("data-over-dark-hero", "true");
    const brandTitle = page.locator("nav a.navbar-brand .navbar-brand-title");
    const brandColor = await brandTitle.evaluate((element) => window.getComputedStyle(element).color);
    expect(brandColor).toBe("rgb(255, 255, 255)");

    const subtitleColor = await page
      .locator("nav a.navbar-brand .navbar-brand-subtitle")
      .evaluate((element) => window.getComputedStyle(element).color);
    expect(subtitleColor).toBe("rgb(0, 168, 107)");

    await expect(page.getByRole("heading", { name: /Clinical workflows, one platform/i })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "Platform" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("button", { name: "Solutions" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "Resources" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "Sign In" })).toBeVisible();

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
    await expect(mobileNav.getByRole("button", { name: "Solutions" })).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "Resources" })).toBeVisible();
    await expect(mobileMenu.getByRole("link", { name: "Sign In" })).toBeVisible();
    await expect(mobileMenu.getByRole("link", { name: "Get Started" })).toBeVisible();
  });

  test("solutions dropdown exposes grouped audience links", async ({ page }) => {
    await page.goto("/");

    const solutionsButton = page.getByRole("navigation").getByRole("button", { name: "Solutions" });
    await solutionsButton.click();

    const menu = page.getByRole("menu");
    await expect(menu.getByRole("menuitem", { name: /Clinicians & practices/i })).toHaveAttribute(
      "href",
      "/for-clinicians"
    );
    await expect(menu.getByRole("menuitem", { name: /Hospitals & ICS/i })).toHaveAttribute("href", "/for-hospitals");
    await expect(menu.getByRole("menuitem", { name: /Pharma & research/i })).toHaveAttribute("href", "/for-research");
    await expect(menu.getByRole("menuitem", { name: /Patients & carers/i })).toHaveAttribute("href", "/for-patients");
    await expect(menu.getByRole("menuitem", { name: "View all roles" })).toHaveAttribute("href", "/platform#roles");
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

  test("audience pages use solid navbar and cohesive marketing sections", async ({ page }) => {
    await page.goto("/for-clinicians");

    const nav = page.locator("nav[data-solid-navbar]");
    await expect(nav).toHaveAttribute("data-solid-navbar", "true");
    await expect(nav).toHaveAttribute("data-over-dark-hero", "false");

    await expect(page.getByRole("heading", { name: /Challenges we hear every day/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /How Aksh Health helps/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Agents and dashboards for clinical teams/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Ready to get started/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Get Started" }).first()).toBeVisible();
    await expect(page.getByLabel("Compliance and safety credentials").first()).toBeVisible();
  });

  test("platform page loads with cohesive sections", async ({ page }) => {
    await page.goto("/platform");

    const nav = page.locator("nav[data-over-dark-hero]");
    await expect(nav).toHaveAttribute("data-over-dark-hero", "true");

    const platformLink = page.getByRole("navigation").getByRole("link", { name: "Platform" });
    await expect(platformLink).toBeVisible();
    const platformColor = await platformLink.evaluate((element) => window.getComputedStyle(element).color);
    expect(platformColor).toMatch(/rgba?\(255,\s*255,\s*255/);

    await expect(page.getByRole("heading", { name: /One platform, eight roles, clinician-owned AI/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /How the platform works/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Eight role dashboards/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Human-in-the-loop/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "See it in action" }).first()).toBeVisible();
  });

  test("resources page loads with expected sections", async ({ page }) => {
    await page.goto("/resources");

    await expect(
      page.getByRole("heading", { name: /Compliance-aware clinical AI for the NHS/i })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /Architecture overview/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Compliance frameworks/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /FHIR and interoperability/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /HITL specification/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Security" }).first()).toBeVisible();
  });

  test("/docs redirects to platform resources", async ({ page }) => {
    await page.goto("/docs");
    await expect(page).toHaveURL(/\/resources/);
    await expect(
      page.getByRole("heading", { name: /Compliance-aware clinical AI for the NHS/i })
    ).toBeVisible();
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

  test("/demo redirects to flagship clinical walkthrough", async ({ page }) => {
    await page.goto("/demo");
    await expect(page).toHaveURL(/\/demo\/patel/);
    await expect(page.getByRole("heading", { name: /Mr James Patel walkthrough/i })).toBeVisible();
  });

  test("clinical walkthrough routes load", async ({ page }) => {
    await page.goto("/demo/patel");
    await expect(page.getByRole("heading", { name: /Mr James Patel walkthrough/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open step surface" })).toBeVisible();

    await page.goto("/demo/voice-care-day3");
    await expect(page.getByRole("heading", { name: /Post-consult check-in: Mr James Patel/i })).toBeVisible();
  });

  test("footer exposes product, audience, and trust links", async ({ page }) => {
    await page.goto("/");

    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: "See demo" })).toHaveAttribute("href", "/demo/patel");
    await expect(footer.getByRole("link", { name: "Resources" })).toHaveAttribute("href", "/resources");
    await expect(footer.getByRole("link", { name: "For Clinicians" })).toBeVisible();
    await expect(footer.getByRole("link", { name: "Security" })).toBeVisible();
    await expect(footer.getByRole("link", { name: "Integrations" })).toBeVisible();
  });
});
