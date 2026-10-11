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
  const image = await request.get("/_next/image?url=%2Ffavicon.ico&w=64&q=75");
  expect(image.status()).toBeGreaterThanOrEqual(400);
});
