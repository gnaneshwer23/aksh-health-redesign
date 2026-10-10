/**
 * Public marketing/auth page smoke checks.
 *
 * Usage:
 *   npm run smoke:public
 *   SMOKE_BASE_URL=https://akshhealth.com npm run smoke:public
 *
 * Expected markers match region-adaptable (not NHS-primary) publication copy.
 */

const baseUrl = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";

const pages = [
  { path: "/", text: "Clinical intelligence" },
  { path: "/", text: "Diabetes care" },
  { path: "/platform", text: "One intelligence layer" },
  {
    path: "/security",
    text: "Human review, audit trails, and honest compliance language for clinical deployments",
  },
  { path: "/contact", text: "Talk to Aksh Health" },
  { path: "/signup", text: "Create your account" },
  { path: "/signin", text: "Sign in" },
  { path: "/get-started", text: "Request a pilot for your organisation" },
  { path: "/demo", text: "Mr James Patel walkthrough" },
  { path: "/demo/patel", text: "Mr James Patel walkthrough" },
];

async function assertOk(url, expectedText) {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }

  if (expectedText) {
    const html = await response.text();
    if (!html.includes(expectedText)) {
      throw new Error(`${url} did not include expected text: ${expectedText}`);
    }
  }
}

for (const page of pages) {
  await assertOk(`${baseUrl}${page.path}`, page.text);
}

console.log(`Public page smoke checks passed for ${baseUrl} (${pages.length} pages)`);
