import { expect, test } from "@playwright/test";

test.describe("Marketing smoke", () => {
  test("homepage loads with a simple nav and get started CTA", async ({ page }) => {
    await page.goto("/");

    const nav = page.locator("nav[data-over-light-hero]");
    await expect(nav).toHaveAttribute("data-over-light-hero", "true");
    await expect(nav).toHaveAttribute("data-over-dark-hero", "false");
    await expect(nav).toHaveAttribute("data-solid-navbar", "false");
    const brandTitle = page.locator("nav a.owkin-nav__brand .owkin-nav__wordmark");
    const brandColor = await brandTitle.evaluate((element) => window.getComputedStyle(element).color);
    expect(brandColor).toBe("rgb(20, 32, 30)");

    await expect(page.getByRole("heading", { name: /Clinical work,\s*properly coordinated/i })).toBeVisible();
    await expect(page.locator("section.owkin-hero .owkin-hero__brand")).toHaveText("Aksh Health");
    const desktopNav = page.locator("nav.owkin-nav .owkin-nav__center");
    await expect(desktopNav.getByRole("link", { name: "Platform" })).toBeVisible();
    await expect(desktopNav.getByRole("link", { name: "Security" })).toBeVisible();
    await expect(desktopNav.getByRole("link", { name: "Contact" })).toBeVisible();
    await expect(desktopNav.getByRole("link", { name: "Demo" })).toHaveCount(0);
    await expect(page.locator("nav.owkin-nav .owkin-nav__bar").getByRole("link", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("button", { name: "Platform" })).toHaveCount(0);
    await expect(desktopNav.getByRole("link", { name: "Workflow" })).toHaveCount(0);
    await expect(desktopNav.getByRole("link", { name: "Resources" })).toHaveCount(0);

    const primaryCta = page.locator("nav.owkin-nav .owkin-nav__bar").getByRole("link", { name: "Get started" });
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
    await expect(mobileNav.getByRole("link", { name: "Security" })).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "Contact" })).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "Demo" })).toHaveCount(0);
    await expect(mobileMenu.getByRole("link", { name: "Sign in" })).toBeVisible();
    await expect(mobileMenu.getByRole("link", { name: "Get started" })).toBeVisible();
  });

  test("trust strip shows compliance badges on homepage", async ({ page }) => {
    await page.goto("/");

    const trustStrip = page.getByLabel("Product trust signals");
    await expect(trustStrip).toBeVisible();
    await expect(trustStrip.getByText("Audit trail on every decision").first()).toBeVisible();
    await expect(trustStrip.getByText("Draft until a clinician decides").first()).toBeVisible();
    await expect(trustStrip.getByText("UK data residency").first()).toBeVisible();
    await expect(trustStrip.getByText("Built for diabetes & primary care").first()).toBeVisible();
  });

  test("custom 404 page renders branded message", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");

    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Return home" })).toBeVisible();
  });

  test("homepage clinician gate emphasises named clinician control without cohort marketing", async ({ page }) => {
    await page.goto("/");

    const gate = page.locator("section.owkin-clinician-gate");
    await expect(gate.getByRole("heading", { name: /Every output is a draft/i })).toBeVisible();
    await expect(gate.getByRole("link", { name: /Security & clinical safety/i })).toHaveAttribute("href", "/security");
    await expect(gate.getByRole("link", { name: /Open Patel walkthrough/i })).toHaveAttribute("href", "/demo/patel");
    await expect(page.getByText(/tested with 100 patients/i)).toHaveCount(0);
    await expect(page.getByText(/100 patients and 100 users/i)).toHaveCount(0);
  });

  test("homepage roles section highlights product-aligned role dashboards", async ({ page }) => {
    await page.goto("/");

    const roles = page.locator("section#roles");
    await expect(roles.getByRole("heading", { name: /Designed for every role/i })).toBeVisible();
    await expect(roles.locator(".owkin-roles__band-label", { hasText: "Care delivery" })).toBeVisible();
    await expect(roles.locator(".owkin-roles__band-label", { hasText: "Governance" })).toBeVisible();
    await expect(roles.getByRole("heading", { name: "GP", exact: true })).toBeVisible();
    await expect(roles.getByText("Clinician dashboard")).toBeVisible();
    await expect(roles.getByText("Admin · Audit")).toBeVisible();
    await expect(roles.getByRole("link", { name: /View roles on the platform/i })).toHaveAttribute(
      "href",
      "/platform#roles"
    );
    await expect(roles.getByRole("link", { name: /Open Patel demo/i })).toHaveAttribute("href", "/demo/patel");
  });

  test("homepage surfaces how-it-works pillars after the hero", async ({ page }) => {
    await page.goto("/");

    const hero = page.getByRole("heading", { name: /Clinical work,\s*properly coordinated/i });
    await expect(hero).toBeVisible();
    await expect(page.getByText("How it works", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Capture", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Review", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Govern", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Integrate", { exact: true }).first()).toBeVisible();
  });

  test("homepage closing CTA band has readable contrast", async ({ page }) => {
    await page.goto("/");

    const band = page.locator("[data-cta-band]");
    await expect(band).toBeVisible();
    await expect(band.getByRole("heading", { name: /Clinical work that stays under control/i })).toBeVisible();

    const titleColor = await band
      .getByRole("heading", { name: /Clinical work that stays under control/i })
      .evaluate((el) => window.getComputedStyle(el).color);
    expect(titleColor).toBe("rgb(20, 32, 30)");

    const primary = band.getByRole("link", { name: "Request access" });
    await expect(primary).toBeVisible();
    await expect(band.getByRole("link", { name: /^Contact$/i })).toBeVisible();
    const primaryBg = await primary.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const primaryColor = await primary.evaluate((el) => window.getComputedStyle(el).color);
    expect(primaryBg).toBe("rgb(0, 168, 142)");
    expect(primaryColor).toBe("rgb(255, 255, 255)");
  });

  test("homepage hero does not render readable labels behind the headline", async ({ page }) => {
    await page.goto("/");

    const hero = page.locator("section.owkin-hero");
    const visual = hero.locator(".owkin-hero__visual");
    await expect(visual).toBeVisible();
    await expect(visual.getByText("Aksh Health", { exact: true })).toHaveCount(0);
    await expect(visual.getByText("Capture", { exact: true }).first()).toBeVisible();
    await expect(visual.getByText("Orchestrate", { exact: true })).toBeVisible();
    await expect(visual.getByText("Documentation", { exact: true }).first()).toBeVisible();
    await expect(visual.getByText("Drug safety", { exact: true })).toBeVisible();
    await expect(visual.getByText("Risk", { exact: true }).first()).toBeVisible();
    await expect(visual.getByText("Referral", { exact: true }).first()).toBeVisible();
    await expect(visual.getByText("Clinician review", { exact: true })).toBeVisible();
    await expect(visual.getByText("Record staging", { exact: true })).toBeVisible();
    await expect(visual.getByText("Audit", { exact: true }).first()).toBeVisible();
    await expect(visual.getByText("EMIS Web", { exact: true })).toBeVisible();
    await expect(visual.getByText("SystmOne", { exact: true })).toBeVisible();
    await expect(visual.getByText("Parallel checks", { exact: true }).first()).toBeVisible();
    await expect(visual.getByText("Clinician-approved only · not a live record write", { exact: true })).toBeVisible();
    await expect(visual.getByText("CANVAS", { exact: true })).toHaveCount(0);
    await expect(visual.getByText("SYNTHESIS", { exact: true })).toHaveCount(0);
    await expect(visual.getByText("Parallel drafts", { exact: true })).toHaveCount(0);
    await expect(visual.getByText(/Drafts only/i)).toHaveCount(0);
    await expect(hero.getByText("HITL")).toHaveCount(0);
    await expect(hero.locator(".owkin-hero__scrim")).toHaveCount(0);
    await expect(hero.locator(".owkin-hero__atmosphere")).toHaveCount(0);
    await expect(hero.getByTestId("interop-pipeline-diagram")).toBeVisible();
    await expect(hero.getByTestId("hero-agent-pipeline")).toBeVisible();
    expect(await hero.getByTestId("pipeline-arrow-down").count()).toBeGreaterThanOrEqual(3);
    expect(await hero.getByTestId("pipeline-arrow-right").count()).toBeGreaterThanOrEqual(2);

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

    const captureBox = await visual.getByText("Capture", { exact: true }).first().boundingBox();
    const orchestrateBox = await visual.getByText("Orchestrate", { exact: true }).boundingBox();
    const reviewBox = await visual.getByText("Clinician review", { exact: true }).boundingBox();
    expect(captureBox).not.toBeNull();
    expect(orchestrateBox).not.toBeNull();
    expect(reviewBox).not.toBeNull();
    expect(Math.abs(captureBox!.y - orchestrateBox!.y)).toBeLessThan(24);
    expect(captureBox!.x).toBeLessThan(orchestrateBox!.x);
    expect(orchestrateBox!.y).toBeLessThan(reviewBox!.y);
    expect(diagramBox!.height).toBeLessThan(720);

    const docs = await visual.getByText("Documentation", { exact: true }).first().boundingBox();
    const safety = await visual.getByText("Drug safety", { exact: true }).boundingBox();
    const risk = await visual.getByText("Risk", { exact: true }).first().boundingBox();
    const referral = await visual.getByText("Referral", { exact: true }).first().boundingBox();
    expect(docs).not.toBeNull();
    expect(safety).not.toBeNull();
    expect(risk).not.toBeNull();
    expect(referral).not.toBeNull();
    expect(docs!.width).toBeGreaterThan(70);
    expect(safety!.width).toBeGreaterThan(70);
    expect(risk!.width).toBeGreaterThan(40);
    expect(referral!.width).toBeGreaterThan(60);
    expect(Math.abs(docs!.y - safety!.y)).toBeLessThan(12);
    expect(Math.abs(risk!.y - referral!.y)).toBeLessThan(12);
    expect(risk!.y).toBeGreaterThan(docs!.y + docs!.height - 4);
    expect(safety!.x).toBeGreaterThan(docs!.x + docs!.width + 6);
  });

  test("homepage product band shows the review queue mock", async ({ page }) => {
    await page.goto("/");

    const mock = page.locator(".aksh-product-mock");
    await expect(mock).toBeVisible();
    await expect(mock.locator(".owkin-product-card__title")).toHaveText("Mr J. Patel");
    await expect(page.locator(".owkin-float-chip")).toHaveCount(0);
  });

  test("footer is compact with product, company, and legal links", async ({ page }) => {
    await page.goto("/");

    const footer = page.locator("footer.owkin-footer");
    await expect(footer.getByLabel("Newsletter signup")).toHaveCount(0);
    await expect(footer.getByRole("link", { name: "Platform", exact: true })).toHaveAttribute("href", "/platform");
    await expect(footer.getByRole("link", { name: "Security", exact: true })).toHaveAttribute("href", "/security");
    await expect(footer.getByRole("link", { name: "Demo", exact: true })).toHaveAttribute("href", "/demo/patel");
    await expect(footer.getByRole("link", { name: "Contact" })).toHaveAttribute("href", "/contact");
    await expect(footer.getByRole("link", { name: "Cookie Policy" })).toHaveAttribute("href", "/cookies");
  });

  test("platform page loads with cohesive sections", async ({ page }) => {
    await page.goto("/platform");

    const nav = page.locator("nav.owkin-nav");
    await expect(nav).toHaveAttribute("data-over-dark-hero", "false");
    await expect(nav).toHaveAttribute("data-solid-navbar", "true");

    await expect(page.locator("nav.owkin-nav .owkin-nav__center").getByRole("link", { name: "Platform" })).toHaveAttribute(
      "href",
      "/platform"
    );
    await expect(page.getByRole("heading", { name: /One platform, eight roles, clinician-owned care/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Capture → draft → approve → exchange/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Designed for every role/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Supporting intelligence\. One review queue/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Clinician approval\. Always\./i })).toBeVisible();
    await expect(page.locator("section#roles")).toBeVisible();
    await expect(page.getByLabel("Product trust signals").first()).toBeVisible();
  });

  test("platform capability grid uses human labels", async ({ page }) => {
    await page.goto("/platform");

    await expect(page.getByRole("heading", { name: /Supporting intelligence\. One review queue/i })).toBeVisible();
    await expect(page.getByText("Clinical Capture", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Documentation", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("FHIR Exchange", { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/Phase 2/i)).toHaveCount(0);
    await expect(page.getByText(/liveEmis:false/i)).toHaveCount(0);
  });

  test("contact page renders production content and common questions", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { name: /Talk to Aksh Health/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Request organisation access/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /hello@akshhealth.com/i })).toHaveAttribute(
      "href",
      "mailto:hello@akshhealth.com"
    );
    await expect(page.getByText(/Does Aksh Health replace my EHR/i)).toBeVisible();
    await expect(page.getByText(/Is Aksh Health MHRA-certified/i)).toBeVisible();
  });

  test("get-started page is organisation enquiry, distinct from signup", async ({ page }) => {
    await page.goto("/get-started");

    await expect(
      page.getByRole("heading", { name: /Request access for your organisation/i })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Create your account instead/i })).toHaveAttribute("href", "/signup");
    await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();

    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
    await expect(page.getByTestId("signup-role-grid")).toBeVisible();
  });

  test("/docs redirects to security", async ({ page }) => {
    await page.goto("/docs");
    await expect(page).toHaveURL(/\/security/);
    await expect(page.getByRole("heading", { name: /Trust is a gate, not a slogan/i })).toBeVisible();
  });

  test("security page loads with expected headings", async ({ page }) => {
    await page.goto("/security");
    await expect(page.getByRole("heading", { name: /Trust is a gate, not a slogan/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /GDPR Art\. 9 special category data/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Honest limits/i })).toBeVisible();
    await expect(page.getByText(/MHRA certification, registration, or device marking/i)).toBeVisible();
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
    await expect(page).toHaveURL(/\/platform/);

    await page.goto("/about");
    await expect(page).toHaveURL(/\/platform/);

    await page.goto("/careers");
    await expect(page).toHaveURL(/\/contact/);

    await page.goto("/how-it-works");
    await expect(page).toHaveURL(/\/platform/);

    await page.goto("/for-clinicians");
    await expect(page).toHaveURL(/\/platform/);

    await page.goto("/faq");
    await expect(page).toHaveURL(/\/contact/);

    await page.goto("/resources");
    await expect(page).toHaveURL(/\/security/);

    await page.goto("/walkthrough");
    await expect(page).toHaveURL(/\/demo\/patel/);
  });

  test("clinical walkthrough routes load", async ({ page }) => {
    await page.goto("/demo/patel");
    await expect(page.getByRole("heading", { name: /Mr James Patel walkthrough/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Sign in to open step|Open step surface/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Voice Care Day-3/i })).toHaveCount(0);

    await expect(page.getByRole("link", { name: "Sign in to open step" })).toHaveAttribute(
      "href",
      /\/signin\?callbackUrl=/
    );
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByRole("link", { name: "Open step surface" })).toHaveAttribute("href", "/dashboard/gp");
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

  test("footer exposes cookie policy link", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: "Cookie Policy" })).toHaveAttribute("href", "/cookies");
    const response = await page.request.get("/cookies");
    expect(response.status()).toBeLessThan(400);
  });
});
