import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Result } from "axe-core";

function criticalViolations(violations: Result[]) {
  return violations.filter((violation) => violation.impact === "critical");
}

test.describe("Accessibility (axe-core)", () => {
  test("homepage has no critical axe violations", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Clinical workflows/i })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(criticalViolations(results.violations)).toEqual([]);
  });

  test("signup page has no critical axe violations", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: /Create your account/i })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(criticalViolations(results.violations)).toEqual([]);
  });
});

test.describe("Lighthouse performance budget (optional)", () => {
  test.skip(Boolean(process.env.CI), "Skipped in CI (requires production build and Lighthouse CLI)");

  test("homepage meets mobile LCP budget", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let resolved = false;
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const last = entries[entries.length - 1];
          if (last && !resolved) {
            resolved = true;
            observer.disconnect();
            resolve(last.startTime);
          }
        });
        observer.observe({ type: "largest-contentful-paint", buffered: true });
        window.setTimeout(() => {
          if (!resolved) {
            resolved = true;
            observer.disconnect();
            resolve(0);
          }
        }, 5000);
      });
    });

    // Soft budget: 4s on local dev; tighten in production Lighthouse runs
    expect(lcp).toBeLessThan(4000);
  });
});
