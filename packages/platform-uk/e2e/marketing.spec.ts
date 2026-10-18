import { expect, test } from "@playwright/test";

/** The public site: the real product only. No demos, walkthroughs, sandbox offers or chat widget. */
test.describe("Public site", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("aksh_cookie_consent", "essential"));
  });

  test("home leads with the available workflows and one pilot call to action", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Diabetes reviews, better coordinated.");
    const hero = page.locator(".s-hero-panel");
    await expect(hero.getByRole("link", { name: "Request an organisational pilot" })).toHaveAttribute("href", "/get-started");
    // No section repeated from other pages: the full capability list and limits live on How it works.
    await expect(page.locator("[data-pillars]")).toHaveCount(0);
    await expect(page.locator(".s-limits")).toHaveCount(0);
    await expect(hero).toContainText("Cancelled-slot fill");
    // Each available workflow: how it works, what staff do, what you measure.
    for (const id of ["slot_fill", "cgm_monitoring"]) {
      const w = page.locator(`[data-workflow="${id}"]`);
      await expect(w).toHaveAttribute("data-status", "production");
      for (const label of ["How it works", "What staff do", "What you measure"]) await expect(w).toContainText(label);
    }
    // The clinical review vision comes after what is available, and is labelled as in validation.
    const order = await page.evaluate(() => ["available-now", "diabetes"].map((id) => document.getElementById(id)!.getBoundingClientRect().top));
    expect(order[0]).toBeLessThan(order[1]);
    await expect(page.locator("#diabetes")).toContainText("In validation");
    const nav = page.locator("[data-site-nav]");
    for (const label of ["How it works", "Available now", "Security", "Resources", "Contact"]) await expect(nav.getByRole("link", { name: label, exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Request a pilot" })).toHaveAttribute("href", "/get-started");
    await expect(nav.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/signin");
    await expect(page.getByText("Illustrative example").first()).toBeVisible();
  });

  test("no demo, walkthrough, sandbox or chat widget anywhere on the public pages", async ({ page }) => {
    for (const path of ["/", "/platform", "/product", "/security", "/resources", "/contact", "/get-started"]) {
      await page.goto(path);
      // "Synthetic demo" is a capability status label (lib/status/capabilities.ts), not an offer of a demo.
      const text = (await page.locator("body").innerText()).toLowerCase().replaceAll("synthetic demo", "");
      for (const banned of ["walkthrough", "patel", "sandbox", "try without an account", "demo"]) {
        expect(text, `${path} mentions "${banned}"`).not.toContain(banned);
      }
      await expect(page.locator('a[href^="/demo"], a[href="/asha"]')).toHaveCount(0);
      await expect(page.getByRole("button", { name: /Open Ask Aksh Health chat/i })).toHaveCount(0);
    }
  });

  test("mobile menu opens with every link", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    for (const label of ["How it works", "Available now", "Security", "Resources", "Contact", "Request a pilot", "Sign in"]) {
      await expect(page.locator(".s-nav__panel").getByRole("link", { name: label, exact: true })).toBeVisible();
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, "no horizontal scroll at phone width").toBeLessThanOrEqual(0);
  });

  test("how it works: system map, two walkthroughs with product screens, control, getting started", async ({ page }) => {
    await page.goto("/platform");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Aksh works beside your systems, and your team decides.");
    await expect(page.locator("[data-system-map]")).toContainText("Prepares the work");
    for (const id of ["where", "slot-fill", "glucose", "control", "start"]) await expect(page.locator(`#${id}`)).toBeVisible();
    await expect(page.locator("#slot-fill .s-frame").first()).toBeVisible();
    // Limits and named-person decisions live here, once.
    await expect(page.locator("#control .s-limits")).toContainText("No patient data sent to AI models in production");
    await expect(page.locator("#capabilities [data-pillars]")).toContainText("Lifestyle support");
  });

  test("statuses on how it works come from the capability register", async ({ page }) => {
    await page.goto("/platform");
    const slot = page.locator('[data-pillars] [data-status]').filter({ hasText: "Cancelled-slot fill" });
    await expect(slot).toHaveAttribute("data-status", "production");
    await expect(slot).toContainText("Production");
    const queue = page.locator('[data-pillars] [data-status]').filter({ hasText: "Clinical review queue" });
    await expect(queue).toHaveAttribute("data-status", "in_validation");
    await expect(page.locator("[data-pillars]")).toContainText("Built; not yet released for real patients");
  });

  test("public pages carry no internal codenames or process names", async ({ page }) => {
    for (const path of ["/", "/platform", "/product", "/security", "/resources"]) {
      await page.goto(path);
      const text = await page.locator("main").innerText();
      for (const banned of ["CONDUCTOR", "GUARDIAN", "SYNTHESIS", "HORIZON", "NEXUS", "CANVAS", "Track B", "PRD"]) {
        expect(text, `${path} shows "${banned}"`).not.toContain(banned);
      }
    }
  });

  test("available now describes two workflows and links to the step-by-step", async ({ page }) => {
    await page.goto("/product");
    await expect(page.locator(".s-page-head")).toContainText("Two workflows are in production");
    await expect(page.locator("#slot-fill").getByRole("link", { name: "Step by step →" })).toHaveAttribute("href", "/platform#slot-fill");
    await expect(page.locator("#monitoring").getByRole("link", { name: "Step by step →" })).toHaveAttribute("href", "/platform#glucose");
  });

  test("product page sections are reachable by anchor", async ({ page }) => {
    await page.goto("/product");
    for (const id of ["slot-fill", "monitoring", "patients", "results", "connect"]) await expect(page.locator(`#${id}`)).toBeVisible();
  });

  test("security page covers each area", async ({ page }) => {
    await page.goto("/security");
    for (const h of ["Access control", "Authentication", "Audit and integrity", "Data protection", "Operations", "Clinical safety"]) {
      await expect(page.getByRole("heading", { level: 2, name: h, exact: true })).toBeVisible();
    }
  });

  test("resources hub lists every guide and each guide opens", async ({ page }) => {
    await page.goto("/resources");
    const cards = page.locator("[data-guide-card]");
    await expect(cards).toHaveCount(8);
    const hrefs = await cards.evaluateAll((els) => els.map((e) => e.getAttribute("href")!));
    for (const href of hrefs) {
      const res = await page.goto(href);
      expect(res?.status(), href).toBe(200);
      await expect(page.locator("[data-guide]")).toBeVisible();
    }
    await page.goto("/resources/not-a-guide");
    await expect(page.getByRole("heading", { name: "This page does not exist." })).toBeVisible();
  });

  test("request access validates before sending", async ({ page }) => {
    await page.goto("/get-started");
    await page.getByRole("button", { name: "Send request" }).click();
    await expect(page.getByText("Enter your name.")).toBeVisible();
    await expect(page.getByText("Enter a valid work email address.")).toBeVisible();
    await expect(page.getByText("Choose an organisation type.")).toBeVisible();
    // First contact is short: systems and go-live commitments move to the scoping call.
    await expect(page.locator("form input, form select")).toHaveCount(6);
  });

  test("request a pilot submits with only the six first-contact fields", async ({ page }) => {
    let body: Record<string, unknown> | null = null;
    await page.route("**/api/access-requests", async (route) => {
      body = route.request().postDataJSON();
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ referenceLabel: "AR-TEST" }) });
    });
    await page.goto("/get-started");
    await page.locator("#field-contactName input").fill("Test Lead");
    await page.locator("#field-contactEmail input").fill("lead@example.org");
    await page.locator("#field-orgName input").fill("Example Diabetes Centre");
    await page.locator("#field-orgType select").selectOption({ index: 1 });
    await page.locator("#field-region select").selectOption({ index: 1 });
    await page.locator("#field-listSize select").selectOption({ index: 1 });
    await page.getByRole("button", { name: "Send request" }).click();
    await expect(page.getByRole("status")).toContainText("Request received");
    expect(body).not.toBeNull();
  });

  test("contact page offers request a pilot and email", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.locator("main").getByRole("link", { name: "Request a pilot →" })).toHaveAttribute("href", "/get-started");
    await expect(page.getByRole("link", { name: "gnaneshwer.jadav@gmail.com" })).toHaveAttribute("href", "mailto:gnaneshwer.jadav@gmail.com");
    await expect(page.locator("body")).not.toContainText("@akshhealth.com");
  });

  test("every footer link resolves", async ({ page }) => {
    await page.goto("/");
    const hrefs = await page.locator("footer a[href^='/']").evaluateAll((els) => [...new Set(els.map((e) => e.getAttribute("href")!.split("#")[0]))]);
    for (const href of hrefs) {
      const res = await page.request.get(href);
      expect(res.status(), href).toBeLessThan(400);
    }
  });

  test("retired pages redirect to their replacements", async ({ page }) => {
    for (const [from, to] of [
      ["/for-clinicians", "/platform"],
      ["/for-patients", "/product"],
      ["/for-organisations", "/platform"],
      ["/integrations", "/resources/schedule-connector"],
      ["/faq", "/resources"],
      ["/about", "/platform"],
      ["/careers", "/contact"],
    ]) {
      await page.goto(from);
      await expect(page, from).toHaveURL(new RegExp(`${to.replace(/\//g, "\\/")}(#.*)?$`));
    }
  });

  test("404 page is branded", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");
    await expect(page.getByRole("heading", { name: "This page does not exist." })).toBeVisible();
  });

  test("legal pages render with contents", async ({ page }) => {
    for (const path of ["/privacy", "/terms", "/cookies"]) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(200);
      await expect(page.getByRole("navigation", { name: "Sections" })).toBeVisible();
    }
  });

  test("cookie consent banner appears on first visit", async ({ page }) => {
    await page.addInitScript(() => window.localStorage.removeItem("aksh_cookie_consent"));
    await page.goto("/");
    const banner = page.getByRole("dialog", { name: /Cookies on Aksh Health/i });
    await expect(banner).toBeVisible();
    await expect(banner.getByRole("button", { name: "Reject all" })).toBeVisible();
    await expect(banner.getByRole("link", { name: "Cookie Policy" })).toHaveAttribute("href", "/cookies");
  });

  test("sitemap lists the public pages and guides", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    for (const p of ["/platform", "/product", "/security", "/resources", "/resources/schedule-connector"]) expect(xml).toContain(p);
    expect(xml).not.toContain("/demo/");
  });
});
