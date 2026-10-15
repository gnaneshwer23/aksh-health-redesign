import { expect, test } from "@playwright/test";

/** The public site: the real product only. No demos, walkthroughs, sandbox offers or chat widget. */
test.describe("Public site", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("aksh_cookie_consent", "essential"));
  });

  test("home leads with the vision and shows what is live", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Clinical intelligence, under clinical control.");
    await expect(page.getByText("Aksh Intelligence Platform · first module: Aksh Diabetes")).toBeVisible();
    await expect(page.locator("#available-now")).toContainText("Cancelled-slot fill");
    // PRD v1.1: two pillars on shared foundations, every item with its status.
    const pillars = page.locator("[data-pillars]");
    await expect(pillars).toContainText("Patient access");
    await expect(pillars).toContainText("Clinical review");
    await expect(pillars).toContainText("Shared foundations");
    const nav = page.locator("[data-site-nav]");
    for (const label of ["How it works", "Available now", "Security", "Resources", "Contact"]) await expect(nav.getByRole("link", { name: label, exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Request access" })).toHaveAttribute("href", "/get-started");
    await expect(nav.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/signin");
    await expect(page.getByText("Illustrative example").first()).toBeVisible();
  });

  test("no demo, walkthrough, sandbox or chat widget anywhere on the public pages", async ({ page }) => {
    for (const path of ["/", "/platform", "/product", "/security", "/resources", "/contact", "/get-started"]) {
      await page.goto(path);
      const text = (await page.locator("body").innerText()).toLowerCase();
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
    for (const label of ["How it works", "Available now", "Security", "Resources", "Contact", "Request access", "Sign in"]) {
      await expect(page.locator(".s-nav__panel").getByRole("link", { name: label, exact: true })).toBeVisible();
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, "no horizontal scroll at phone width").toBeLessThanOrEqual(0);
  });

  test("how it works: data flow, diabetes now and next, controls, go-live; no internal engineering detail", async ({ page }) => {
    await page.goto("/platform");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Aksh works beside your records system, not instead of it.");
    for (const id of ["flow", "diabetes", "controls", "go-live"]) await expect(page.locator(`#${id}`)).toBeVisible();
    await expect(page.locator('[data-diabetes-areas] [data-availability="available"]')).toContainText("Glucose and CGM");
    await expect(page.locator('[data-diabetes-areas] [data-availability="development"]')).toContainText("Medication safety");
  });

  test("public pages carry no internal codenames or engineering status", async ({ page }) => {
    for (const path of ["/", "/platform", "/product", "/security", "/resources"]) {
      await page.goto(path);
      const text = await page.locator("main").innerText();
      for (const banned of ["CONDUCTOR", "GUARDIAN", "SYNTHESIS", "HORIZON", "NEXUS", "CANVAS", "Synthetic validation", "synthetic validation", "Planned", "Track B", "PRD"]) {
        expect(text, `${path} shows "${banned}"`).not.toContain(banned);
      }
    }
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
    await expect(page.getByText("Confirm at least one commitment.")).toBeVisible();
  });

  test("contact page offers request access and email", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.locator("main").getByRole("link", { name: "Request access →" })).toHaveAttribute("href", "/get-started");
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
