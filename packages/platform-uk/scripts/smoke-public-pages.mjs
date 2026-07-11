const baseUrl = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";

const pages = [
  { path: "/", text: "Clinical workflows, one platform." },
  { path: "/platform", text: "The AI Healthcare Operating System" },
  { path: "/for-clinicians", text: "Spend time with patients, not paperwork." },
  { path: "/for-practices", text: "Run the practice with clear oversight." },
  { path: "/for-patients", text: "Your health, understood and supported." },
  { path: "/security", text: "Data protection and clinical safety for NHS deployments." },
  { path: "/integrations", text: "Integration-ready architecture for NHS care settings." },
  { path: "/signup", text: "Choose your role" },
  { path: "/get-started", text: "Get your organisation set up" },
  { path: "/onboarding", text: "Choose your role. Start with the right work." },
  { path: "/dashboards", text: "One product, three professional operating views." },
  { path: "/demo", text: "A 7-minute walkthrough for a professional product review." }
];

const assets = [
  "/_next/static/css/app/layout.css",
  "/_next/static/chunks/main-app.js"
];

async function assertOk(url, expectedText) {
  const response = await fetch(url);
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

for (const asset of assets) {
  await assertOk(`${baseUrl}${asset}`);
}

console.log(`Public page smoke checks passed for ${baseUrl}`);
