import { expect, test } from "@playwright/test";

test("security: baseline headers on pages and APIs; image optimizer disabled", async ({ request }) => {
  for (const path of ["/", "/api/health"]) {
    const r = await request.get(path);
    const h = r.headers();
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["x-powered-by"]).toBeUndefined();
  }
  // The setting itself (the app serves no optimizable image to probe with), then the endpoint never serves an image.
  // @ts-expect-error plain ESM config without type declarations
  const config = (await import("../next.config.mjs")).default("phase-production-build") as { images?: { unoptimized?: boolean } };
  expect(config.images?.unoptimized).toBe(true);
  const image = await request.get("/_next/image?url=%2Ffavicon.ico&w=64&q=75");
  expect(image.status()).toBeGreaterThanOrEqual(400);
  expect(image.status()).toBeLessThan(500);
  expect(image.headers()["content-type"] ?? "").not.toMatch(/^image\//);
});
