const baseUrl = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";

const pages = [
  { path: "/", text: "Clinical work" },
  { path: "/platform", text: "One platform, eight roles" },
  { path: "/security", text: "Data protection and clinical safety for NHS deployments" },
  { path: "/contact", text: "Talk to Aksh Health" },
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
