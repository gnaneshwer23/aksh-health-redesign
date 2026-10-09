import { expect, test } from "@playwright/test";

test.describe("Marketing smoke", () => {
  test("homepage loads with floating nav and pilot CTA", async ({ page }) => {
    await page.goto("/");

    const nav = page.locator("nav[data-site-nav]");
    await expect(nav).toBeVisible();
    await expect(nav.locator(".lv-nav__wordmark")).toHaveText("Aksh Health");

    await expect(page.getByRole("heading", { level: 1, name: /Clinical intelligence, under clinical control/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Walk through Mr Patel/i })).toBeVisible();
    await expect(page.getByText("Synthetic patient. Not a live record.", { exact: true })).toBeVisible();
    const desktopNav = nav.locator("[data-nav-center]");
    await expect(desktopNav.getByRole("link", { name: "Platform" })).toBeVisible();
    await expect(desktopNav.getByRole("link", { name: "How it works" })).toBeVisible();
    await expect(desktopNav.getByRole("link", { name: "Safety & Trust" })).toBeVisible();
    await expect(desktopNav.getByRole("link", { name: "Resources" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "See Demo" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("button", { name: "Platform" })).toHaveCount(0);

    const primaryCta = nav.getByRole("link", { name: "Request Pilot" });
    await expect(primaryCta).toBeVisible();
    await expect(primaryCta).toHaveAttribute("href", "/get-started");
    const ctaColor = await primaryCta.evaluate((el) => window.getComputedStyle(el).color);
    expect(ctaColor).toBe("rgb(255, 255, 255)");
  });

  test("mobile viewport shows hamburger menu with drawer links", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const menuButton = page.getByRole("button", { name: "Open menu" });
    await expect(menuButton).toBeVisible();
    await expect(page.locator("[data-nav-center]")).toBeHidden();

    await menuButton.click();

    const mobileMenu = page.getByRole("dialog");
    const mobileNav = mobileMenu.getByRole("navigation", { name: "Mobile navigation" });
    await expect(mobileNav.getByRole("link", { name: "Platform" })).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "How it works" })).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "Safety & Trust" })).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "Resources" })).toBeVisible();
    await expect(mobileMenu.getByRole("link", { name: "See Demo" })).toBeVisible();
    await expect(mobileMenu.getByRole("link", { name: "Request Pilot" })).toBeVisible();
  });

  test("trust strip shows compliance badges on homepage", async ({ page }) => {
    await page.goto("/");

    const trustStrip = page.getByLabel("Product trust signals").first();
    await expect(trustStrip).toBeVisible();
    await expect(trustStrip.getByText("Human review").first()).toBeVisible();
    await expect(trustStrip.getByText("Auditability").first()).toBeVisible();
    await expect(trustStrip.getByText("UK data posture").first()).toBeVisible();
    await expect(trustStrip.getByText("Diabetes & primary care").first()).toBeVisible();
  });

  test("custom 404 page renders branded message", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");

    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Return home" })).toBeVisible();
  });

  test("homepage clinician gate emphasises named clinician control without cohort marketing", async ({ page }) => {
    await page.goto("/");

    const gate = page.locator("section[data-clinician-gate]");
    await expect(gate.getByRole("heading", { name: /Every output is a draft/i })).toBeVisible();
    await expect(gate.getByRole("link", { name: /Security & clinical safety/i })).toHaveAttribute("href", "/security");
    await expect(gate.getByRole("link", { name: /Open Patel walkthrough/i })).toHaveAttribute("href", "/demo/patel");
    await expect(page.getByText(/tested with 100 patients/i)).toHaveCount(0);
    await expect(page.getByText(/100 patients and 100 users/i)).toHaveCount(0);
  });

  test("homepage roles section highlights product-aligned role dashboards", async ({ page }) => {
    await page.goto("/");

    const roles = page.locator("section#roles");
    await expect(roles.getByRole("heading", { name: /One coordination layer\. Different clinical realities/i })).toBeVisible();
    await expect(roles.locator(".lv-role__band", { hasText: "Care delivery" }).first()).toBeVisible();
    await expect(roles.locator(".lv-role__band", { hasText: "Governance" }).first()).toBeVisible();
    await expect(roles.getByRole("heading", { name: "GP", exact: true })).toBeVisible();
    await expect(roles.getByText("Clinician dashboard")).toBeVisible();
    await expect(roles.getByText("Admin · Audit")).toBeVisible();
    // Only dashboards that open without sign-in get a direct link.
    await expect(roles.getByRole("link", { name: "Open synthetic demo" })).toHaveCount(2);
    await expect(roles.getByRole("link", { name: /View roles on the platform/i })).toHaveAttribute(
      "href",
      "/platform#roles"
    );
    await expect(roles.getByRole("link", { name: /Open Patel demo/i })).toHaveAttribute("href", "/demo/patel");
  });

  test("homepage surfaces how-it-works pillars after the hero", async ({ page }) => {
    await page.goto("/");

    const gate = page.locator("section[data-clinician-gate]");
    await expect(gate.getByText("How it works", { exact: true })).toBeVisible();
    for (const pillar of ["Capture", "Review", "Govern", "Integrate"]) {
      await expect(gate.getByText(pillar, { exact: true })).toBeVisible();
    }
  });

  test("homepage closing CTA band has readable contrast", async ({ page }) => {
    await page.goto("/");

    const band = page.locator("[data-cta-band]");
    await expect(band).toBeVisible();
    const title = band.getByRole("heading", { name: /Clinical intelligence should help clinicians think/i });
    await expect(title).toBeVisible();
    expect(await title.evaluate((el) => window.getComputedStyle(el).color)).toBe("rgb(255, 255, 255)");

    const primary = band.getByRole("link", { name: "Request a Pilot" });
    await expect(primary).toBeVisible();
    await expect(band.getByRole("link", { name: /Open the Patel Walkthrough/i })).toBeVisible();
    expect(await primary.evaluate((el) => window.getComputedStyle(el).backgroundColor)).toBe("rgb(255, 255, 255)");
    expect(await primary.evaluate((el) => window.getComputedStyle(el).color)).toBe("rgb(5, 4, 10)");
  });

  test("homepage hero shows Patel signals with every clinical status", async ({ page }) => {
    await page.goto("/");

    const hero = page.locator("section").filter({
      has: page.getByRole("heading", { level: 1, name: /Clinical intelligence, under clinical control/i }),
    });
    await expect(hero).toBeVisible();
    const signals = hero.getByRole("list", { name: /Signals from a synthetic patient/i });
    await expect(signals).toBeVisible();
    // P002 canonical value: 68 mmol/mol (8.4%), same as the GP review queue.
    await expect(signals.getByText("HbA1c 68 mmol/mol")).toBeVisible();
    await expect(page.getByText(/72 mmol\/mol/)).toHaveCount(0);
    await expect(signals.getByText("LOINC 59261-8")).toBeVisible();
    await expect(signals.getByText("Apixaban with aspirin")).toBeVisible();
    await expect(signals.getByText("HbA1c “about 60”")).toBeVisible();
    await expect(signals.getByText("Medication review booked")).toBeVisible();
    await expect(signals.getByText("needs review", { exact: true })).toBeVisible();
    await expect(signals.getByText("held", { exact: true })).toBeVisible();
    await expect(signals.getByText("unverified", { exact: true })).toBeVisible();
    await expect(signals.getByText("approved", { exact: true })).toBeVisible();
    await expect(hero.getByText(/Not a live EHR write/i)).toBeVisible();
    await expect(hero.getByRole("link", { name: /Walk through Mr Patel/i })).toHaveAttribute("href", "/demo/patel");
    await expect(hero.getByRole("link", { name: /Request a pilot/i })).toHaveAttribute("href", "/get-started");
  });

  test("homepage capabilities are numbered drafts, not autonomous tools", async ({ page }) => {
    await page.goto("/");

    const caps = page.locator('[data-section="capabilities"]');
    await expect(caps.getByRole("heading", { name: /Clinical capabilities you can rely on/i })).toBeVisible();
    await expect(caps.locator(".lv-card")).toHaveCount(8);
    await expect(caps.getByText("001")).toBeVisible();
    await expect(caps.getByText("008")).toBeVisible();
    await expect(caps.getByText(/none of them writes to the record/i)).toBeVisible();
  });

  test("homepage honesty section separates live, evaluated and not claimed", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /What’s live, what’s evaluated, what isn’t/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Working in this build" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Being evaluated" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "What we don’t claim" })).toBeVisible();
    await expect(page.getByText("MHRA certification or registration")).toBeVisible();
    await expect(page.getByText("Live EMIS or SystmOne write-back")).toBeVisible();
    await expect(page.getByRole("heading", { name: /In production/i })).toHaveCount(0);
  });

  test("homepage pilot steps keep live patient data behind approvals", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /A pilot that earns its next step/i })).toBeVisible();
    await expect(page.getByText(/Live patient data waits for your DPIA and approvals/i)).toBeVisible();
  });

  test("footer is compact with product, company, and legal links", async ({ page }) => {
    await page.goto("/");

    const footer = page.locator("footer.lv-footer");
    await expect(footer.getByLabel("Newsletter signup")).toHaveCount(0);
    await expect(footer.getByRole("link", { name: "Platform", exact: true })).toHaveAttribute("href", "/platform");
    await expect(footer.getByRole("link", { name: "Safety & security", exact: true })).toHaveAttribute("href", "/security");
    await expect(footer.getByRole("link", { name: "Patel walkthrough", exact: true })).toHaveAttribute("href", "/demo/patel");
    await expect(footer.getByRole("link", { name: "Contact" })).toHaveAttribute("href", "/contact");
    await expect(footer.getByRole("link", { name: "Cookie Policy" })).toHaveAttribute("href", "/cookies");
  });

  test("platform page loads with cohesive sections", async ({ page }) => {
    await page.goto("/platform");

    const platformLink = page.locator("nav[data-site-nav] [data-nav-center]").getByRole("link", { name: "Platform" });
    await expect(platformLink).toHaveAttribute("href", "/platform");
    await expect(platformLink).toHaveAttribute("aria-current", "page");
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

    await expect(page.getByRole("heading", { name: /Request a pilot for your organisation/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /create an account instead/i })).toHaveAttribute("href", "/signup");
    await expect(page.getByText(/Live patient data waits for your DPIA and approvals/i)).toBeVisible();

    // Continue validates the step locally before moving on.
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Enter your organisation name.")).toBeVisible();
    await expect(page.getByText("Enter a valid email address.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Organisation details" })).toBeVisible();

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
