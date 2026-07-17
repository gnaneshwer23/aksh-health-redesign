import { expect, test } from "@playwright/test";

test.describe("Marketing smoke", () => {
  test("homepage loads with nav links and visible get started CTA", async ({ page }) => {
    await page.goto("/");

    const nav = page.locator("nav[data-over-light-hero]");
    await expect(nav).toHaveAttribute("data-over-light-hero", "true");
    await expect(nav).toHaveAttribute("data-over-dark-hero", "false");
    await expect(nav).toHaveAttribute("data-solid-navbar", "false");
    const brandTitle = page.locator("nav a.owkin-nav__brand .owkin-nav__wordmark");
    const brandColor = await brandTitle.evaluate((element) => window.getComputedStyle(element).color);
    expect(brandColor).toBe("rgb(20, 20, 20)");

    await expect(page.getByRole("heading", { name: /Clinical workflows, one platform/i })).toBeVisible();
    await expect(page.getByText("Aksh Health", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("button", { name: "What it is" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "How it works" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("button", { name: "Who for" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "Safety" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "See it" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "Sign In" })).toBeVisible();

    const primaryCta = page.getByRole("navigation").getByRole("link", { name: "Talk to us" });
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
    await expect(page.locator(".owkin-nav__center")).toBeHidden();

    await menuButton.click();

    const mobileMenu = page.getByRole("dialog");
    const mobileNav = mobileMenu.getByRole("navigation", { name: "Mobile navigation" });
    await expect(mobileNav.getByRole("link", { name: "What it is" })).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "How it works" })).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "Who for" })).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "Safety" })).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "See it" })).toBeVisible();
    await expect(mobileMenu.getByRole("link", { name: "Sign In" })).toBeVisible();
    await expect(mobileMenu.getByRole("link", { name: "Talk to us" })).toBeVisible();
  });

  test("who-for mega-menu exposes unique audience links", async ({ page }) => {
    await page.goto("/");

    const whoForButton = page.locator("nav").getByRole("button", { name: "Who for", exact: true });
    await whoForButton.hover();
    const menu = page.locator(".owkin-mega");
    await expect(menu).toBeVisible();
    await menu.hover();

    await expect(menu.locator('a[href="/for-clinicians"]')).toBeVisible();
    await expect(menu.locator('a[href="/for-practices"]')).toBeVisible();
    await expect(menu.locator('a[href="/for-patients"]')).toBeVisible();
    await expect(menu.locator('a[href="/for-hospitals"]')).toBeVisible();
    await expect(menu.locator('a[href="/for-ics"]')).toBeVisible();
    await expect(menu.locator('a[href="/for-administrators"]')).toBeVisible();
    await expect(menu.locator('a[href="/for-research"]')).toBeVisible();
    await expect(menu.locator('a[href="/platform#roles"]')).toBeVisible();

    const hrefs = await menu.locator("a[href]").evaluateAll((anchors) =>
      anchors.map((a) => a.getAttribute("href")).filter((href): href is string => Boolean(href))
    );
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  test("what-it-is mega-menu avoids duplicate destinations", async ({ page }) => {
    await page.goto("/");

    const button = page.locator("nav").getByRole("button", { name: "What it is", exact: true });
    await button.hover();
    const menu = page.locator(".owkin-mega");
    await expect(menu).toBeVisible();
    await menu.hover();
    const platformHrefs = await menu.locator("a[href]").evaluateAll((anchors) =>
      anchors.map((a) => a.getAttribute("href")).filter((href): href is string => Boolean(href))
    );

    expect(platformHrefs).toContain("/platform");
    expect(platformHrefs).toContain("/how-it-works#journey");
    expect(platformHrefs).not.toContain("/how-it-works");
    expect(new Set(platformHrefs).size).toBe(platformHrefs.length);

    await page.locator("nav a.owkin-nav__brand").hover();
    await expect(page.locator(".owkin-mega")).toHaveCount(0);
  });

  test("mobile drawer mirrors unique Who-for audience links", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();

    const mobileNav = page.getByRole("dialog").getByRole("navigation", { name: "Mobile navigation" });
    await expect(mobileNav.getByRole("link", { name: "Clinicians", exact: true })).toHaveAttribute(
      "href",
      "/for-clinicians"
    );
    await expect(mobileNav.getByRole("link", { name: "Administrators", exact: true })).toHaveAttribute(
      "href",
      "/for-administrators"
    );
    await expect(mobileNav.getByRole("link", { name: "Patients", exact: true })).toHaveAttribute(
      "href",
      "/for-patients"
    );
    await expect(mobileNav.getByRole("link", { name: "FAQ", exact: true })).toHaveAttribute("href", "/faq");
    await expect(mobileNav.getByRole("link", { name: "Ask", exact: true })).toHaveAttribute("href", "/chat");
    await expect(mobileNav.getByRole("link", { name: "Safety", exact: true })).toHaveAttribute("href", "/security");
    await expect(mobileNav.getByRole("link", { name: "See it", exact: true })).toHaveAttribute("href", "/walkthrough");
    await expect(mobileNav.getByRole("link", { name: "Contact", exact: true })).toHaveAttribute("href", "/contact");
    await expect(mobileNav.getByRole("link", { name: "Pharmacists" })).toHaveCount(0);
    await expect(mobileNav.getByRole("link", { name: "Practices", exact: true })).toHaveCount(0);
  });

  test("trust strip shows compliance badges on homepage", async ({ page }) => {
    await page.goto("/");

    const trustStrip = page.getByLabel("Compliance and safety credentials");
    await expect(trustStrip).toBeVisible();
    await expect(trustStrip.getByText("NHS-ready")).toBeVisible();
    await expect(trustStrip.getByText("FHIR R4")).toBeVisible();
    await expect(trustStrip.getByText("Human-in-the-loop")).toBeVisible();
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
    await expect(page.getByRole("heading", { name: /One command view for trust pressure/i })).toBeVisible();

    await page.goto("/for-administrators");
    await expect(page.getByRole("heading", { name: /Keep integrations healthy/i })).toBeVisible();

    await page.goto("/for-ics");
    await expect(page.getByRole("heading", { name: /See population health across your system/i })).toBeVisible();

    await page.goto("/for-research");
    await expect(page.getByRole("heading", { name: /Evaluate outcomes with governed access/i })).toBeVisible();
  });

  test("audience pages use solid navbar and problem-outcome-cta sections", async ({ page }) => {
    await page.goto("/for-clinicians");

    const nav = page.locator("nav[data-solid-navbar]");
    await expect(nav).toHaveAttribute("data-solid-navbar", "true");
    await expect(nav).toHaveAttribute("data-over-dark-hero", "false");

    await expect(page.getByRole("heading", { name: /What slows care today/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /What changes/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Capture, draft, approve/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Ready to talk/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Talk to us" }).first()).toBeVisible();
    await expect(page.getByLabel("Compliance and safety credentials").first()).toBeVisible();
    await expect(page.locator(".marketing-pastel-card").first()).toBeVisible();

    await page.goto("/for-practices");
    await expect(page.getByRole("heading", { name: /Set up, oversee, evidence/i })).toBeVisible();

    await page.goto("/for-hospitals");
    await expect(page.getByRole("heading", { name: /Connect, monitor, act/i })).toBeVisible();
  });

  test("homepage shows platform flow diagram with link to full journey", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /Capture → draft → approve/i })).toBeVisible();
    await expect(page.getByRole("figure", { name: /Care journey/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /See full journey/i })).toHaveAttribute("href", "/how-it-works");
  });

  test("homepage roles section highlights product-aligned role dashboards", async ({ page }) => {
    await page.goto("/");

    const roles = page.locator("section#roles");
    await expect(roles.getByRole("heading", { name: /Built for every role/i })).toBeVisible();
    await expect(roles.getByText("Care delivery")).toBeVisible();
    await expect(roles.getByText("Governance")).toBeVisible();

    await expect(roles.getByRole("link", { name: /GP/i }).first()).toHaveAttribute("href", "/for-clinicians");
    await expect(roles.getByText("Clinician dashboard")).toBeVisible();
    await expect(roles.locator(".owkin-roles__signals li", { hasText: "Consult capture" })).toBeVisible();
    await expect(roles.locator(".owkin-roles__signals li", { hasText: "SOAP drafts" })).toBeVisible();

    await expect(roles.getByRole("link", { name: /Practice Admin/i })).toHaveAttribute("href", "/for-practices");
    await expect(roles.getByText("Admin · Audit")).toBeVisible();
    await expect(roles.locator(".owkin-roles__signals li", { hasText: "Audit" }).first()).toBeVisible();

    await expect(roles.getByRole("link", { name: /ICS \/ Regional Lead/i })).toHaveAttribute("href", "/for-ics");
    await expect(roles.locator(".owkin-roles__signals li", { hasText: "Equity" }).first()).toBeVisible();

    await expect(roles.getByRole("link", { name: /Explore roles on the platform/i })).toHaveAttribute(
      "href",
      "/platform#roles"
    );
    await expect(roles.getByRole("link", { name: /Walk the Patel demo/i })).toHaveAttribute("href", "/demo/patel");
  });

  test("homepage surfaces platform story and outcome stats after the hero", async ({ page }) => {
    await page.goto("/");

    const hero = page.getByRole("heading", { name: /Clinical workflows, one platform/i });
    const story = page.getByRole("heading", { name: /Clinical work is profoundly fragmented/i });
    await expect(hero).toBeVisible();
    await expect(story).toBeVisible();

    const heroBox = await hero.boundingBox();
    const storyBox = await story.boundingBox();
    expect(heroBox).not.toBeNull();
    expect(storyBox).not.toBeNull();
    expect(storyBox!.y).toBeGreaterThan(heroBox!.y);

    await expect(page.getByText("4 sec")).toBeVisible();
    await expect(page.getByText("14 days")).toBeVisible();
    await expect(page.getByText("Auto-writes without approval")).toBeVisible();
  });

  test("homepage closing CTA band has readable dark contrast", async ({ page }) => {
    await page.goto("/");

    const band = page.locator("[data-cta-band]");
    await expect(band).toBeVisible();
    await expect(band.getByRole("heading", { name: /Ready for your organisation/i })).toBeVisible();

    const bg = await band.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(bg).toBe("rgb(20, 20, 20)");

    const titleColor = await band
      .getByRole("heading", { name: /Ready for your organisation/i })
      .evaluate((el) => window.getComputedStyle(el).color);
    expect(titleColor).toBe("rgb(255, 255, 255)");

    const primary = band.getByRole("link", { name: "Talk to us" });
    await expect(primary).toBeVisible();
    const primaryBg = await primary.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const primaryColor = await primary.evaluate((el) => window.getComputedStyle(el).color);
    expect(primaryBg).toBe("rgb(255, 255, 255)");
    expect(primaryColor).toBe("rgb(20, 20, 20)");
  });

  test("homepage hero does not render readable labels behind the headline", async ({ page }) => {
    await page.goto("/");

    const hero = page.locator("section.owkin-hero");
    const product = hero.locator(".owkin-hero__product");
    await expect(product).toBeVisible();
    await expect(product.getByText("Clinical queue")).toBeVisible();
    await expect(hero.getByText("HITL")).toHaveCount(0);
    await expect(hero.getByText("clinician gate")).toHaveCount(0);
    await expect(hero.locator(".owkin-hero__scrim")).toHaveCount(0);
    await expect(hero.locator(".owkin-hero__atmosphere")).toHaveCount(0);
  });

  test("homepage agent and FHIR scenes use quiet product mocks", async ({ page }) => {
    await page.goto("/");

    const voiceMock = page.locator(".aksh-mock-voice");
    await expect(voiceMock).toBeVisible();
    await expect(page.locator(".aksh-mock-frame__title", { hasText: "Voice consult" })).toBeVisible();

    const fhirMock = page.locator(".aksh-mock-stack");
    await expect(fhirMock).toBeVisible();
    await expect(fhirMock.getByText("Clinician queue")).toBeVisible();
    await expect(fhirMock.getByText("FHIR staging")).toBeVisible();
    await expect(page.locator(".owkin-float-chip")).toHaveCount(0);
  });

  test("how-it-works page loads with diagram and platform stages", async ({ page }) => {
    await page.goto("/how-it-works");

    await expect(page.getByRole("heading", { name: /How Aksh Health works/i })).toBeVisible();
    await expect(page.getByRole("figure", { name: /Care journey/i }).first()).toBeVisible();
    await expect(page.getByRole("figure", { name: /End-to-end journey/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Capture, draft, approve/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /How it works for your team/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Clinician" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Practice manager" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Clinician approval on every output/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Data flow from EHR to governed record/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Ready to see it in your organisation/i })).toBeVisible();
  });

  test("platform page loads with cohesive sections", async ({ page }) => {
    await page.goto("/platform");

    const nav = page.locator("nav.owkin-nav");
    await expect(nav).toHaveAttribute("data-over-dark-hero", "false");
    await expect(nav).toHaveAttribute("data-solid-navbar", "true");

    const howItWorks = page.getByRole("navigation").getByRole("link", { name: "How it works" });
    await expect(howItWorks).toBeVisible();
    await expect(howItWorks).toHaveAttribute("href", "/how-it-works");

    await expect(page.getByRole("heading", { name: /One platform, eight roles, clinician-owned care/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /How the platform works/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Built for every role/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Eight capabilities\. One review queue/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Clinician approval\. Always\./i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Create account" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Request organisation access" }).first()).toBeVisible();
    await expect(page.locator("section#roles")).toBeVisible();
    await expect(page.getByLabel("Compliance and safety credentials").first()).toBeVisible();
  });

  test("faq and contact pages render production content", async ({ page }) => {
    await page.goto("/faq");
    await expect(page.getByRole("heading", { name: /Questions procurement and clinical teams ask/i })).toBeVisible();
    await expect(page.getByText(/Does Aksh Health replace EMIS Web or SystmOne/i)).toBeVisible();
    await expect(page.getByText(/Is Aksh Health MHRA-certified/i)).toBeVisible();

    await page.goto("/contact");
    await expect(page.getByRole("heading", { name: /Talk to Aksh Health/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Request organisation access/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /hello@akshhealth.com/i })).toHaveAttribute(
      "href",
      "mailto:hello@akshhealth.com"
    );
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
    await expect(page.getByRole("heading", { name: /Trust is a gate, not a slogan/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /GDPR Art\. 9 special category data/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Honest limits/i })).toBeVisible();
    await expect(page.getByText(/Not claimed in this build/i)).toBeVisible();

    await page.goto("/integrations");
    await expect(
      page.getByRole("heading", { name: /Integration-ready architecture for NHS care settings/i })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /FHIR R4 resources/i })).toBeVisible();
  });

  test("case walkthrough page frames the Patel demo", async ({ page }) => {
    await page.goto("/walkthrough");
    await expect(page.getByRole("heading", { name: /Walk the Patel practice end to end/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open live demo" }).first()).toHaveAttribute("href", "/demo/patel");
    await expect(page.getByRole("link", { name: "Launch Patel demo" })).toHaveAttribute("href", "/demo/patel");
  });

  test("/demo redirects to flagship clinical walkthrough", async ({ page }) => {
    await page.goto("/demo");
    await expect(page).toHaveURL(/\/demo\/patel/);
    await expect(page.getByRole("heading", { name: /Mr James Patel walkthrough/i })).toBeVisible();
  });

  test("/voice-care redirects to Patel walkthrough", async ({ page }) => {
    await page.goto("/voice-care");
    await expect(page).toHaveURL(/\/demo\/patel/);
    await expect(page.getByRole("heading", { name: /Mr James Patel walkthrough/i })).toBeVisible();
  });

  test("legacy marketing aliases redirect without 404", async ({ page }) => {
    await page.goto("/solutions");
    await expect(page).toHaveURL(/\/for-clinicians/);

    await page.goto("/about");
    await expect(page).toHaveURL(/\/platform/);

    await page.goto("/careers");
    await expect(page).toHaveURL(/\/contact/);
  });

  test("clinical walkthrough routes load", async ({ page }) => {
    await page.goto("/demo/patel");
    await expect(page.getByRole("heading", { name: /Mr James Patel walkthrough/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Sign in to open step|Open step surface/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Voice Care Day-3/i })).toHaveCount(0);

    // Default step 0 (admin) is auth-gated; clinician steps stay public.
    await expect(page.getByRole("link", { name: "Sign in to open step" })).toHaveAttribute(
      "href",
      /\/signin\?callbackUrl=/
    );
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByRole("link", { name: "Open step surface" })).toHaveAttribute("href", "/dashboard/gp");
  });

  test("footer exposes product, audience, and trust links", async ({ page }) => {
    await page.goto("/");

    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: "How it works" })).toHaveAttribute("href", "/how-it-works");
    await expect(footer.getByRole("link", { name: "See demo" })).toHaveAttribute("href", "/demo/patel");
    await expect(footer.getByRole("link", { name: "Resources", exact: true })).toHaveAttribute("href", "/resources");
    await expect(footer.getByRole("link", { name: "How we price" })).toHaveAttribute("href", "/pricing");
    await expect(footer.getByRole("link", { name: "Case walkthrough" })).toHaveAttribute("href", "/walkthrough");
    await expect(footer.getByRole("link", { name: "Clinicians", exact: true })).toBeVisible();
    await expect(footer.getByRole("link", { name: "Security & safety" })).toHaveAttribute("href", "/security");
    await expect(footer.getByRole("link", { name: "Integrations" })).toBeVisible();
    await expect(footer.getByRole("link", { name: "FAQ", exact: true })).toHaveAttribute("href", "/faq");
    await expect(footer.getByRole("link", { name: "Ask Aksh Health" })).toHaveAttribute("href", "/chat");
    await expect(footer.getByRole("link", { name: "Cookie Policy" })).toHaveAttribute("href", "/cookies");
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

    const cta = page.getByRole("link", { name: /Download integration brief/i }).first();
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

  test("marketing chat widget opens from homepage", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("aksh_cookie_consent", "essential");
    });
    await page.goto("/");

    const openChat = page.getByRole("button", { name: /Open Ask Aksh Health chat/i });
    await expect(openChat).toBeVisible();
    const statusPromise = page.waitForResponse(
      (response) => response.url().includes("/api/chat") && response.request().method() === "GET"
    );
    await openChat.click();
    await statusPromise;

    const dialog = page.getByRole("dialog", { name: /Ask Aksh Health/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/Product questions/i)).toBeVisible();
    await expect(dialog.getByPlaceholder(/Ask about Aksh Health|Chat unavailable/i)).toBeVisible();
  });

  test("dedicated chat page loads", async ({ page }) => {
    await page.goto("/chat");
    await expect(
      page.getByRole("heading", { name: /Questions about Aksh Health, answered from our public docs/i })
    ).toBeVisible();
    await expect(page.getByPlaceholder(/Ask about Aksh Health|Chat unavailable/i)).toBeVisible();
  });

  test("footer exposes cookie policy link", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: "Cookie Policy" })).toHaveAttribute("href", "/cookies");
    const response = await page.request.get("/cookies");
    expect(response.status()).toBeLessThan(400);
  });
});
