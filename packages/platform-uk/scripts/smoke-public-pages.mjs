const baseUrl = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";

const pages = [
  { path: "/", text: "Clinical workflows, one platform" },
  { path: "/platform", text: "One platform, eight roles" },
  { path: "/how-it-works", text: "How Aksh Health works" },
  { path: "/for-clinicians", text: "Spend time with patients" },
  { path: "/for-practices", text: "Run the practice with clear oversight" },
  { path: "/for-patients", text: "Your health, understood and supported" },
  { path: "/for-hospitals", text: "Command your hospital" },
  { path: "/for-administrators", text: "Keep integrations healthy" },
  { path: "/for-ics", text: "See population health across your integrated care system" },
  { path: "/for-research", text: "Evaluate outcomes with governed data access" },
  { path: "/security", text: "Data protection and clinical safety for NHS deployments" },
  { path: "/integrations", text: "Integration-ready architecture for NHS care settings" },
  { path: "/faq", text: "Questions procurement and clinical teams ask" },
  { path: "/contact", text: "Talk to Aksh Health" },
  { path: "/pricing", text: "Pricing scales with your organisation" },
  { path: "/resources", text: "Architecture, compliance, and integration documentation" },
  { path: "/signup", text: "Create your account" },
  { path: "/get-started", text: "Request access for your NHS organisation" },
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
