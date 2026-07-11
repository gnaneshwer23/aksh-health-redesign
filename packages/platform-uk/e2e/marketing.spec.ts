import { expect, test } from "@playwright/test";

test.describe("Marketing smoke", () => {
  test("homepage loads with nav links and visible get started CTA", async ({ page }) => {
    await page.goto("/");

    const nav = page.locator("nav[data-over-dark-hero]");
    await expect(nav).toHaveAttribute("data-over-dark-hero", "false");
    await expect(nav).toHaveAttribute("data-solid-navbar", "true");
    const brandTitle = page.locator("nav a.navbar-brand .navbar-brand-title");
    const brandColor = await brandTitle.evaluate((element) => window.getComputedStyle(element).color);
    expect(brandColor).toBe("rgb(0, 61, 122)");

    const subtitleColor = await page
      .locator("nav a.navbar-brand .navbar-brand-subtitle")
      .evaluate((element) => window.getComputedStyle(element).color);
    expect(subtitleColor).toBe("rgb(0, 107, 79)");

    await expect(page.getByRole("heading", { name: /Clinical workflows, one platform/i })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "Platform" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "How it works" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("button", { name: "Solutions" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "Resources" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "Sign In" })).toBeVisible();

    const primaryCta = page.getByRole("navigation").getByRole("link", { name: "Get Started" });
    await expect(primaryCta).toBeVisible();
    await expect(primaryCta).toHaveAttribute("href", "/get-started");

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
    await expect(mobileNav.getByRole("link", { name: "How it works" })).toBeVisible();
    await expect(mobileNav.getByRole("button", { name: "Solutions" })).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "Resources" })).toBeVisible();
    await expect(mobileMenu.getByRole("link", { name: "Sign In" })).toBeVisible();
    await expect(mobileMenu.getByRole("link", { name: "Get Started" })).toBeVisible();
  });

  test("solutions dropdown exposes grouped audience links", async ({ page }) => {
    await page.goto("/");

    const solutionsButton = page.locator("nav").getByRole("button", { name: "Solutions", exact: true });
    const buttonBox = await solutionsButton.boundingBox();
    await solutionsButton.click();

    const menu = page.getByRole("menu", { name: "Solutions" });
    await expect(menu).toBeVisible();

    const menuBox = await menu.boundingBox();
    expect(menuBox).not.toBeNull();
    expect(buttonBox).not.toBeNull();
    expect(Math.abs(menuBox!.x - buttonBox!.x)).toBeLessThan(16);
    expect(menuBox!.y).toBeGreaterThan(buttonBox!.y + buttonBox!.height - 2);

    await expect(menu.getByRole("menuitem", { name: /Clinicians & practices/i })).toHaveAttribute(
      "href",
      "/for-clinicians"
    );
    await expect(menu.getByRole("menuitem", { name: /Hospitals & ICS/i })).toHaveAttribute("href", "/for-hospitals");
    await expect(menu.getByRole("menuitem", { name: /Pharma & research/i })).toHaveAttribute("href", "/for-research");
    await expect(menu.getByRole("menuitem", { name: /Patients & carers/i })).toHaveAttribute("href", "/for-patients");
    await expect(menu.getByRole("menuitem", { name: "View all roles" })).toHaveAttribute("href", "/platform#roles");

    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
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
    await expect(page.getByRole("heading", { name: /From sign-up to staged FHIR draft/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Agents and dashboards for clinical teams/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Ready to get started/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Get Started" }).first()).toBeVisible();
    await expect(page.getByLabel("Compliance and safety credentials").first()).toBeVisible();
    await expect(page.locator(".marketing-pastel-card").first()).toBeVisible();

    await page.goto("/for-practices");
    await expect(page.getByRole("heading", { name: /From practice setup to team governance/i })).toBeVisible();

    await page.goto("/for-hospitals");
    await expect(page.getByRole("heading", { name: /From connected systems to executive action/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Agents for hospital operations/i })).toBeVisible();
  });

  test("homepage shows platform flow diagram with link to full journey", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /From EHR systems to governed record/i })).toBeVisible();
    await expect(page.getByRole("figure", { name: /Platform flow/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /See full journey/i })).toHaveAttribute("href", "/how-it-works");
  });

  test("homepage surfaces the platform cockpit above the fold with outcome stats", async ({ page }) => {
    await page.goto("/");

    const hero = page.getByRole("heading", { name: /Clinical workflows, one platform/i });
    const cockpit = page.getByRole("heading", { name: /Visibility into every agent, every review/i });
    await expect(hero).toBeVisible();
    await expect(cockpit).toBeVisible();

    const heroBox = await hero.boundingBox();
    const cockpitBox = await cockpit.boundingBox();
    expect(heroBox).not.toBeNull();
    expect(cockpitBox).not.toBeNull();
    // Cockpit should render immediately after the hero, well above the roles grid further down the page.
    expect(cockpitBox!.y).toBeGreaterThan(heroBox!.y);

    await expect(page.getByText("4 sec")).toBeVisible();
    await expect(page.getByText("14 days")).toBeVisible();
    await expect(page.getByText("Auto-writes without approval")).toBeVisible();
  });

  test("how-it-works page loads with diagram and platform stages", async ({ page }) => {
    await page.goto("/how-it-works");

    await expect(page.getByRole("heading", { name: /How Aksh Health works/i })).toBeVisible();
    await expect(
      page.getByRole("figure", { name: /Platform flow/i }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("figure", { name: /End-to-end journey/i })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /Connect, understand, act, and learn/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /How it works for your team/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Clinician" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Practice manager" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Human-in-the-loop on every output/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Data flow from EHR to governed record/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Ready to see it in your organisation/i })).toBeVisible();
  });

  test("platform page loads with cohesive sections", async ({ page }) => {
    await page.goto("/platform");

    const nav = page.locator("nav[data-over-dark-hero]");
    await expect(nav).toHaveAttribute("data-over-dark-hero", "false");
    await expect(nav).toHaveAttribute("data-solid-navbar", "true");

    const platformLink = page.getByRole("navigation").getByRole("link", { name: "Platform" });
    await expect(platformLink).toBeVisible();
    const platformColor = await platformLink.evaluate((element) => window.getComputedStyle(element).color);
    expect(platformColor).toBe("rgb(74, 111, 165)");

    await expect(page.getByRole("heading", { name: /One platform, eight roles, clinician-owned AI/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /How the platform works/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Eight role dashboards/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Human-in-the-loop\. Always\./i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Create account" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Request organisation access" }).first()).toBeVisible();
    await expect(page.locator(".marketing-pastel-card").first()).toBeVisible();
    await expect(page.getByLabel("Compliance and safety credentials").first()).toBeVisible();
  });

  test("resources page loads with expected sections", async ({ page }) => {
    await page.goto("/resources");

    await expect(
      page.getByRole("heading", { name: /Architecture, compliance, and integration documentation/i })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /Find the documentation you need/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Five layers from intake to export/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Aligned design pathways, not certification claims/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /FHIR R4 staging above existing EHR systems/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Security" }).first()).toBeVisible();
    await expect(page.locator(".marketing-pastel-card").first()).toBeVisible();
  });

  test("get-started page is organisation enquiry, distinct from signup", async ({ page }) => {
    await page.goto("/get-started");

    await expect(
      page.getByRole("heading", { name: /Request access for your NHS organisation/i })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Create your account instead/i })).toHaveAttribute("href", "/signup");
    await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();

    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
    await expect(page.getByTestId("signup-role-grid")).toBeVisible();
  });

  test("/docs redirects to platform resources", async ({ page }) => {
    await page.goto("/docs");
    await expect(page).toHaveURL(/\/resources/);
    await expect(
      page.getByRole("heading", { name: /Architecture, compliance, and integration documentation/i })
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
    await expect(footer.getByRole("link", { name: "How it works" })).toHaveAttribute("href", "/how-it-works");
    await expect(footer.getByRole("link", { name: "See demo" })).toHaveAttribute("href", "/demo/patel");
    await expect(footer.getByRole("link", { name: "Resources", exact: true })).toHaveAttribute("href", "/resources");
    await expect(footer.getByRole("link", { name: "How we price" })).toHaveAttribute("href", "/pricing");
    await expect(footer.getByRole("link", { name: "For Clinicians" })).toBeVisible();
    await expect(footer.getByRole("link", { name: "Security" })).toBeVisible();
    await expect(footer.getByRole("link", { name: "Integrations" })).toBeVisible();
  });

  test("audience footer links all render without 404", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    const audienceHrefs = [
      "/for-clinicians",
      "/for-practices",
      "/for-patients",
      "/for-hospitals",
      "/for-administrators",
      "/for-ics",
      "/for-research",
    ];

    for (const href of audienceHrefs) {
      const link = footer.locator(`a[href="${href}"]`);
      await expect(link).toHaveCount(1);
      const response = await page.request.get(href);
      expect(response.status(), `${href} should not 404`).toBeLessThan(400);
    }
  });

  test("pricing page loads with three tiers and no nav clutter", async ({ page }) => {
    await page.goto("/pricing");

    await expect(
      page.getByRole("heading", { name: /Pricing scales with your organisation, not per patient record/i })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Practice", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Organisation", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Trust & ICS" })).toBeVisible();

    // Pricing is intentionally not in the primary nav.
    await expect(page.getByRole("navigation").getByRole("link", { name: "Pricing", exact: true })).toHaveCount(0);
  });

  test("for-administrators offers the integration architecture brief as primary CTA", async ({ page }) => {
    await page.goto("/for-administrators");

    const cta = page.getByRole("link", { name: /Download integration architecture brief/i }).first();
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "/resources#integration");
  });

  test("cookie consent banner appears on first visit", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem("aksh_cookie_consent");
    });
    await page.goto("/");

    const banner = page.getByRole("dialog", { name: /Cookies on Aksh Health/i });
    await expect(banner).toBeVisible();
    await expect(banner.getByRole("button", { name: "Accept all" })).toBeVisible();
    await expect(banner.getByRole("button", { name: "Settings" })).toBeVisible();
    await expect(banner.getByRole("button", { name: "Reject all" })).toBeVisible();
    await expect(banner.getByRole("link", { name: "Cookie Policy" })).toHaveAttribute("href", "/cookies");
  });

  test("footer exposes cookie policy link", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: "Cookie Policy" })).toHaveAttribute("href", "/cookies");
    const response = await page.request.get("/cookies");
    expect(response.status()).toBeLessThan(400);
  });
});
