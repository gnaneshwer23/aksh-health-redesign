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
    expect(brandColor).toBe("rgb(10, 42, 37)");

    await expect(page.getByRole("heading", { name: /Clinical work,\s*properly coordinated/i })).toBeVisible();
    await expect(page.getByText("Care coordination for UK primary care", { exact: true })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("button", { name: "Platform" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "Workflow" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "Security" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("button", { name: "For you" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "Resources" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "Ask" })).toHaveCount(0);
    await expect(page.getByRole("navigation").getByRole("button", { name: "Solutions" })).toHaveCount(0);

    const primaryCta = page.getByRole("navigation").getByRole("link", { name: "Get started" });
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
    await expect(mobileNav.getByRole("link", { name: "Platform" })).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "Workflow" })).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "For you" })).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "Security" })).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "Resources" })).toBeVisible();
    await expect(mobileMenu.getByRole("link", { name: "Sign in" })).toBeVisible();
    await expect(mobileMenu.getByRole("link", { name: "Get started" })).toBeVisible();
  });

  test("who-for mega-menu exposes unique audience links", async ({ page }) => {
    await page.goto("/");

    const whoForButton = page.locator("nav").getByRole("button", { name: "For you", exact: true });
    await whoForButton.hover();
    const menu = page.locator(".owkin-mega");
    await expect(menu).toBeVisible();
    await menu.hover();

    await expect(menu.locator('a[href="/for-clinicians"]')).toBeVisible();
    await expect(menu.locator('a[href="/for-practices"]')).toBeVisible();
    await expect(menu.locator('a[href="/for-patients"]')).toBeVisible();
    await expect(menu.locator('a[href="/for-hospitals"]')).toBeVisible();
    await expect(menu.locator('a[href="/for-ics"]')).toBeVisible();
    await expect(menu.locator('a[href="/for-research"]')).toBeVisible();
    await expect(menu.locator('a[href="/for-administrators"]')).toHaveCount(0);

    const hrefs = await menu.locator("a[href]").evaluateAll((anchors) =>
      anchors.map((a) => a.getAttribute("href")).filter((href): href is string => Boolean(href))
    );
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  test("what-it-is mega-menu avoids duplicate destinations", async ({ page }) => {
    await page.goto("/");

    const button = page.locator("nav").getByRole("button", { name: "Platform", exact: true });
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
    await expect(mobileNav.getByRole("link", { name: "Practices", exact: true })).toHaveAttribute(
      "href",
      "/for-practices"
    );
    await expect(mobileNav.getByRole("link", { name: "Patients", exact: true })).toHaveAttribute(
      "href",
      "/for-patients"
    );
    await expect(mobileNav.getByRole("link", { name: "FAQ", exact: true })).toHaveAttribute("href", "/faq");
    await expect(mobileNav.getByRole("link", { name: "Ask", exact: true })).toHaveCount(0);
    await expect(mobileNav.getByRole("link", { name: "Security", exact: true })).toHaveAttribute("href", "/security");
    await expect(mobileNav.getByRole("link", { name: "Resources", exact: true })).toHaveAttribute("href", "/resources");
    await expect(mobileNav.getByRole("link", { name: "Contact", exact: true })).toHaveAttribute("href", "/contact");
    await expect(mobileNav.getByRole("link", { name: "Pharmacists" })).toHaveCount(0);
  });

  test("trust strip shows compliance badges on homepage", async ({ page }) => {
    await page.goto("/");

    const trustStrip = page.getByLabel("Product trust signals");
    await expect(trustStrip).toBeVisible();
    await expect(trustStrip.getByText("Audit trail on every decision").first()).toBeVisible();
    await expect(trustStrip.getByText("Draft until a clinician decides").first()).toBeVisible();
    await expect(trustStrip.getByText("UK data residency").first()).toBeVisible();
    await expect(trustStrip.getByText("Built for NHS primary care").first()).toBeVisible();
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
    await expect(page.getByRole("heading", { name: /What supports clinic/i })).toBeVisible();
    await expect(page.getByText("What you approve", { exact: true })).toBeVisible();
    await expect(page.getByText("Clinical Capture", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /Capture, draft, approve/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Ready to talk/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Create account" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Book demonstration" }).first()).toHaveAttribute(
      "href",
      "/demo/script"
    );
    await expect(page.getByLabel("Product trust signals").first()).toBeVisible();
    await expect(page.locator(".marketing-pastel-card").first()).toBeVisible();

    await page.goto("/for-practices");
    await expect(page.getByRole("heading", { name: /Ops visibility you oversee/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Set up, oversee, evidence/i })).toBeVisible();
    await expect(page.getByText("Audit", { exact: true }).first()).toBeVisible();

    await page.goto("/for-hospitals");
    await expect(page.getByRole("heading", { name: /Command-centre visibility/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Connect, monitor, act/i })).toBeVisible();
    await expect(page.getByText(/illustrative capacity|not a live PAS/i).first()).toBeVisible();

    await page.goto("/for-research");
    await expect(page.getByRole("heading", { name: /Governed cohorts for service improvement/i })).toBeVisible();

    await page.goto("/for-ics");
    await expect(page.getByRole("heading", { name: /Population insights/i })).toBeVisible();
    await expect(page.getByText("Population Insights", { exact: true }).first()).toBeVisible();

    await page.goto("/for-administrators");
    await expect(page.getByRole("heading", { name: /Integration and audit you operate/i })).toBeVisible();
    
    await page.goto("/for-patients");
    await expect(page.getByRole("heading", { name: /How the platform supports your plan/i })).toBeVisible();
  });

  test("audience capability maps use human labels", async ({ page }) => {
    await page.goto("/for-clinicians#agents-for-you");
    await expect(page.getByText("Clinical Capture", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Documentation", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Safety Review", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /View clinical capabilities/i })).toHaveAttribute(
      "href",
      "/platform#agents"
    );

    await page.goto("/for-research#agents-for-you");
    await expect(page.getByText("Population Insights", { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/Aggregate access by default/i).first()).toBeVisible();
  });

  test("homepage clinician gate emphasises named clinician control without cohort marketing", async ({ page }) => {
    await page.goto("/");

    const gate = page.locator("section.owkin-clinician-gate");
    await expect(gate.getByRole("heading", { name: /Every output is a draft/i })).toBeVisible();
    await expect(gate.getByRole("link", { name: "Get started" })).toHaveAttribute("href", "/get-started");
    await expect(gate.getByRole("link", { name: /Open Patel walkthrough/i })).toHaveAttribute("href", "/demo/patel");
    await expect(page.getByText(/tested with 100 patients/i)).toHaveCount(0);
    await expect(page.getByText(/100 patients and 100 users/i)).toHaveCount(0);
  });

  test("homepage roles section highlights product-aligned role dashboards", async ({ page }) => {
    await page.goto("/");

    const roles = page.locator("section#roles");
    await expect(roles.getByRole("heading", { name: /Designed for every role/i })).toBeVisible();
    await expect(roles.getByText("Care delivery")).toBeVisible();
    await expect(roles.getByText("Governance")).toBeVisible();

    await expect(roles.getByRole("link", { name: /GP/i }).first()).toHaveAttribute("href", "/for-clinicians");
    await expect(roles.getByText("Clinician dashboard")).toBeVisible();
    await expect(roles.locator(".owkin-roles__signals")).toHaveCount(0);
    await expect(roles.getByText(/From the moment you open an appointment/i)).toBeVisible();

    await expect(roles.getByRole("link", { name: /Practice Administrator/i })).toHaveAttribute(
      "href",
      "/for-practices"
    );
    await expect(roles.getByText("Admin · Audit")).toBeVisible();

    await expect(roles.getByRole("link", { name: /ICS \/ Regional Lead/i })).toHaveAttribute("href", "/for-ics");

    await expect(roles.getByRole("link", { name: /View roles on the platform/i })).toHaveAttribute(
      "href",
      "/platform#roles"
    );
    await expect(roles.getByRole("link", { name: /Open Patel demo/i })).toHaveAttribute("href", "/demo/patel");
  });

  test("homepage surfaces platform story and how-it-works pillars after the hero", async ({ page }) => {
    await page.goto("/");

    const hero = page.getByRole("heading", { name: /Clinical work,\s*properly coordinated/i });
    const story = page.getByRole("heading", { name: /Clinical work lives/i });
    await expect(hero).toBeVisible();
    await expect(story).toBeVisible();

    const heroBox = await hero.boundingBox();
    const storyBox = await story.boundingBox();
    expect(heroBox).not.toBeNull();
    expect(storyBox).not.toBeNull();
    expect(storyBox!.y).toBeGreaterThan(heroBox!.y);

    await expect(page.getByText("How it works", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Capture", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Review", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Govern", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Integrate", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Horizon", { exact: true })).toHaveCount(0);
  });

  test("homepage closing CTA band has readable dark contrast", async ({ page }) => {
    await page.goto("/");

    const band = page.locator("[data-cta-band]");
    await expect(band).toBeVisible();
    await expect(band.getByRole("heading", { name: /Clinical work that stays under control/i })).toBeVisible();

    const bg = await band.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(bg).toBe("rgb(10, 42, 37)");

    const titleColor = await band
      .getByRole("heading", { name: /Clinical work that stays under control/i })
      .evaluate((el) => window.getComputedStyle(el).color);
    expect(titleColor).toBe("rgb(255, 255, 255)");

    const primary = band.getByRole("link", { name: "Get started" });
    await expect(primary).toBeVisible();
    await expect(band.getByRole("link", { name: /Book a demonstration/i })).toBeVisible();
    const primaryBg = await primary.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const primaryColor = await primary.evaluate((el) => window.getComputedStyle(el).color);
    expect(primaryBg).toBe("rgb(255, 255, 255)");
    expect(primaryColor).toBe("rgb(10, 42, 37)");
  });

  test("homepage hero does not render readable labels behind the headline", async ({ page }) => {
    await page.goto("/");

    const hero = page.locator("section.owkin-hero");
    const visual = hero.locator(".owkin-hero__visual");
    await expect(visual).toBeVisible();
    await expect(visual.getByText("Aksh Health", { exact: true })).toHaveCount(0);
    await expect(visual.getByText("CANVAS", { exact: true })).toBeVisible();
    await expect(visual.getByText("SYNTHESIS", { exact: true })).toBeVisible();
    await expect(visual.getByText("GUARDIAN", { exact: true })).toBeVisible();
    await expect(visual.getByText("HORIZON", { exact: true })).toBeVisible();
    await expect(visual.getByText("PATHWAY", { exact: true })).toBeVisible();
    await expect(visual.getByText("CONDUCTOR", { exact: true })).toBeVisible();
    await expect(visual.getByText("Clinician review", { exact: true })).toBeVisible();
    await expect(visual.getByText("FHIR staging", { exact: true })).toBeVisible();
    await expect(visual.getByText("SHIELD", { exact: true })).toBeVisible();
    await expect(visual.getByText("EMIS Web", { exact: true })).toBeVisible();
    await expect(visual.getByText("SystmOne", { exact: true })).toBeVisible();
    await expect(visual.getByText("Parallel drafts", { exact: true }).first()).toBeVisible();
    await expect(visual.getByText("Drafts only · no live EMR write", { exact: true })).toBeVisible();
    await expect(visual.getByText("You", { exact: true })).toHaveCount(0);
    await expect(hero.getByText("HITL")).toHaveCount(0);
    await expect(hero.locator(".owkin-hero__scrim")).toHaveCount(0);
    await expect(hero.locator(".owkin-hero__atmosphere")).toHaveCount(0);
    await expect(hero.getByTestId("interop-pipeline-diagram")).toBeVisible();
    await expect(hero.getByTestId("hero-agent-pipeline")).toBeVisible();
    // Vertical pipeline must expose unmistakable ↓ arrows between stages.
    expect(await hero.getByTestId("pipeline-arrow-down").count()).toBeGreaterThanOrEqual(5);
    await expect(hero.getByTestId("pipeline-arrow-right")).toBeVisible();

    const headline = hero.getByRole("heading", { name: /Clinical work,\s*properly coordinated/i });
    const diagram = hero.getByRole("img", { name: /Interoperability diagram/i });
    await expect(diagram).toBeVisible();
    const headlineBox = await headline.boundingBox();
    const diagramBox = await diagram.boundingBox();
    expect(headlineBox).not.toBeNull();
    expect(diagramBox).not.toBeNull();
    const overlapX =
      Math.min(headlineBox!.x + headlineBox!.width, diagramBox!.x + diagramBox!.width) -
      Math.max(headlineBox!.x, diagramBox!.x);
    const overlapY =
      Math.min(headlineBox!.y + headlineBox!.height, diagramBox!.y + diagramBox!.height) -
      Math.max(headlineBox!.y, diagramBox!.y);
    expect(overlapX <= 0 || overlapY <= 0).toBe(true);

    // Stages must stack top→bottom (not a scattered tile collage).
    const canvasBox = await visual.getByText("CANVAS", { exact: true }).boundingBox();
    const conductorBox = await visual.getByText("CONDUCTOR", { exact: true }).boundingBox();
    const reviewBox = await visual.getByText("Clinician review", { exact: true }).boundingBox();
    expect(canvasBox).not.toBeNull();
    expect(conductorBox).not.toBeNull();
    expect(reviewBox).not.toBeNull();
    expect(canvasBox!.y).toBeLessThan(conductorBox!.y);
    expect(conductorBox!.y).toBeLessThan(reviewBox!.y);

    // Parallel drafts: 2×2 with clear gaps (no smashed 4-across overlap).
    const synth = await visual.getByText("SYNTHESIS", { exact: true }).boundingBox();
    const guardian = await visual.getByText("GUARDIAN", { exact: true }).boundingBox();
    const horizon = await visual.getByText("HORIZON", { exact: true }).boundingBox();
    const pathway = await visual.getByText("PATHWAY", { exact: true }).boundingBox();
    expect(synth).not.toBeNull();
    expect(guardian).not.toBeNull();
    expect(horizon).not.toBeNull();
    expect(pathway).not.toBeNull();
    expect(Math.abs(synth!.y - guardian!.y)).toBeLessThan(12);
    expect(Math.abs(horizon!.y - pathway!.y)).toBeLessThan(12);
    expect(horizon!.y).toBeGreaterThan(synth!.y + synth!.height - 4);
    expect(guardian!.x).toBeGreaterThan(synth!.x + synth!.width + 6);
  });

  test("homepage agent and FHIR scenes use quiet product mocks", async ({ page }) => {
    await page.goto("/");

    const voiceMock = page.locator(".aksh-mock-voice");
    await expect(voiceMock).toBeVisible();
    await expect(page.locator(".aksh-mock-frame__title", { hasText: "Voice consult" })).toBeVisible();

    const fhirMock = page.locator(".aksh-mock-stack--flow");
    await expect(fhirMock).toBeVisible();
    await expect(fhirMock.getByText("Clinician queue")).toBeVisible();
    await expect(fhirMock.getByText("FHIR staging")).toBeVisible();
    await expect(fhirMock.getByText("SHIELD audit")).toBeVisible();
    await expect(page.locator(".owkin-float-chip")).toHaveCount(0);
  });

  test("footer hosts newsletter and practice admins label", async ({ page }) => {
    await page.goto("/");

    const footer = page.locator("footer.owkin-footer");
    await expect(footer.getByLabel("Newsletter signup")).toBeVisible();
    await expect(footer.getByRole("link", { name: "Practice admins" })).toHaveAttribute(
      "href",
      "/for-administrators"
    );
    await expect(footer.getByRole("link", { name: "Administrators", exact: true })).toHaveCount(0);
  });

  test("how-it-works page loads with diagram and platform stages", async ({ page }) => {
    await page.goto("/how-it-works");

    await expect(page.getByRole("heading", { name: /How Aksh Health works/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Explain it in two minutes/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Supporting intelligence in the loop/i })).toBeVisible();
    await expect(page.getByRole("figure", { name: /Care journey/i }).first()).toBeVisible();
    await expect(page.getByRole("figure", { name: /End-to-end journey/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Capture, draft, approve", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: /How it works for your team/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Clinician" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Practice manager" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Clinician approval on every output/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Data flow from clinical systems to governed record/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Ready to see it in your organisation/i })).toBeVisible();
      });

  test("platform page loads with cohesive sections", async ({ page }) => {
    await page.goto("/platform");

    const nav = page.locator("nav.owkin-nav");
    await expect(nav).toHaveAttribute("data-over-dark-hero", "false");
    await expect(nav).toHaveAttribute("data-solid-navbar", "true");

    const howItWorks = page.getByRole("navigation").getByRole("link", { name: "Workflow" });
    await expect(howItWorks).toBeVisible();
    await expect(howItWorks).toHaveAttribute("href", "/how-it-works");

    await expect(page.getByRole("heading", { name: /One platform, eight roles, clinician-owned care/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Capture → draft → approve → exchange/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Designed for every role/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Supporting intelligence\. One review queue/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Clinician approval\. Always\./i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Create account" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Book demonstration/i }).first()).toBeVisible();
    await expect(page.locator("section#roles")).toBeVisible();
    await expect(page.getByLabel("Product trust signals").first()).toBeVisible();
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

  test("resources page describes supporting intelligence without engineering jargon", async ({ page }) => {
    await page.goto("/resources");

    await expect(
      page.getByRole("heading", { name: /Architecture, compliance, and integration documentation/i })
    ).toBeVisible();
    await expect(page.getByText(/Supporting intelligence across capture/i)).toBeVisible();
    await expect(page.getByText(/Twelve Phase-1 directory agents/i)).toHaveCount(0);
    await expect(page.getByText(/liveEmis:false/i)).toHaveCount(0);
  });

  test("platform capability grid uses human labels", async ({ page }) => {
    await page.goto("/platform");

    const agents = page.getByRole("heading", { name: /Supporting intelligence\. One review queue/i });
    await expect(agents).toBeVisible();
    await expect(page.getByText("Clinical Capture", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Documentation", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("FHIR Exchange", { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/Phase 2/i)).toHaveCount(0);
    await expect(page.getByText(/liveEmis:false/i)).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Book demonstration/i }).first()).toHaveAttribute(
      "href",
      "/demo/script"
    );
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
    await expect(page.getByRole("heading", { name: /FHIR resources/i })).toBeVisible();
  });

  test("case walkthrough page frames the Patel demo", async ({ page }) => {
    await page.goto("/resources");
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
    await expect(footer.getByRole("link", { name: "Workflow" })).toHaveAttribute("href", "/how-it-works");
    await expect(footer.getByRole("link", { name: "View demo" })).toHaveAttribute("href", "/demo/patel");
    await expect(footer.getByRole("link", { name: "Resources", exact: true })).toHaveAttribute("href", "/resources");
    await expect(footer.getByRole("link", { name: "How we price" })).toHaveAttribute("href", "/pricing");
    await expect(footer.getByRole("link", { name: "Book a walkthrough" })).toHaveAttribute("href", "/walkthrough");
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
      page.getByRole("heading", { name: /Pricing scales with your organisation, not each patient record/i })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Practice", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Organisation", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Trust & ICS" })).toBeVisible();

    // Pricing is intentionally not in the primary nav.
    await expect(page.getByRole("navigation").getByRole("link", { name: "Pricing", exact: true })).toHaveCount(0);
  });

  test("for-administrators offers admin dashboard and signup CTAs", async ({ page }) => {
    await page.goto("/for-administrators");

    await expect(page.getByRole("link", { name: /Open admin dashboard/i }).first()).toHaveAttribute(
      "href",
      "/dashboard/admin"
    );
    await expect(page.getByRole("link", { name: /Create account/i }).first()).toHaveAttribute(
      "href",
      "/signup?role=practice-manager"
    );
    await expect(page.getByRole("link", { name: /Book demonstration/i }).first()).toHaveAttribute(
      "href",
      "/demo/script"
    );
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
    await expect(dialog.getByText(/^Product questions — grounded in our public docs\./i)).toBeVisible();
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
