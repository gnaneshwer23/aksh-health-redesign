/**
 * Hospital executive dashboard smoke checks.
 *
 * Requires a running app (`npm run dev` or `npm run build && npm run start`).
 *
 * Public demo allowlist: `/dashboard/hospital*` is open without auth (synthetic data).
 * Optional auth pass when credentials are set:
 *   SMOKE_HOSPITAL_EMAIL=you@example.com
 *   SMOKE_HOSPITAL_PASSWORD=your-password
 *   SMOKE_BASE_URL=http://127.0.0.1:3000
 */

const baseUrl = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";
const smokeEmail = process.env.SMOKE_HOSPITAL_EMAIL?.trim() ?? "";
const smokePassword = process.env.SMOKE_HOSPITAL_PASSWORD ?? "";
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS ?? 12_000);

const protectedHospitalRoutes = [
  {
    label: "Hospital overview",
    path: "/dashboard/hospital",
    expectedText: ["Command Centre Overview", "Leeds General Infirmary", "Sections"],
  },
  {
    label: "Hospital wards",
    path: "/dashboard/hospital/wards",
    expectedText: ["Ward Status", "medically fit but awaiting discharge"],
  },
  {
    label: "Hospital capacity",
    path: "/dashboard/hospital/capacity",
    expectedText: ["Capacity Forecast", "AI Recommendations"],
  },
  {
    label: "Hospital staffing",
    path: "/dashboard/hospital/staffing",
    expectedText: ["Staffing & Alerts", "Trigger agency request"],
  },
];

const cookieJar = new Map();

function buildUrl(path) {
  return new URL(path, baseUrl).toString();
}

function cookieHeader() {
  return Array.from(cookieJar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

function storeCookies(headers) {
  const setCookieHeaders =
    typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : headers.get("set-cookie")
        ? [headers.get("set-cookie")]
        : [];

  for (const header of setCookieHeaders) {
    if (!header) continue;
    const [cookie] = header.split(";");
    const separatorIndex = cookie.indexOf("=");
    if (separatorIndex === -1) continue;
    cookieJar.set(cookie.slice(0, separatorIndex), cookie.slice(separatorIndex + 1));
  }
}

async function fetchWithTimeout(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const headers = new Headers(options.headers ?? {});
  const cookies = cookieHeader();

  if (cookies) {
    headers.set("cookie", cookies);
  }

  try {
    const response = await fetch(buildUrl(path), {
      ...options,
      headers,
      redirect: "manual",
      signal: controller.signal,
    });
    storeCookies(response.headers);
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`${path} timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function assertPublicDemo(path, expectedSnippets = []) {
  const response = await fetchWithTimeout(path);
  const location = response.headers.get("location") ?? "";

  if (response.status >= 300 && response.status < 400) {
    throw new Error(`${path} should be public demo; redirected to ${location || "unknown"}`);
  }
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status} (expected public 200)`);
  }

  const html = await response.text();
  for (const text of expectedSnippets) {
    if (!html.includes(text)) {
      throw new Error(`${path} missing expected text: ${text}`);
    }
  }

  console.log(`[ok] Public demo accessible: ${path}`);
}

async function assertPage({ label, path, expectedText }) {
  const response = await fetchWithTimeout(path);
  const location = response.headers.get("location");

  if (response.status >= 300 && response.status < 400) {
    throw new Error(`${label} (${path}) redirected to ${location ?? "unknown location"}`);
  }

  if (!response.ok) {
    throw new Error(`${label} (${path}) returned ${response.status}`);
  }

  const html = await response.text();
  for (const text of expectedText) {
    if (!html.includes(text)) {
      throw new Error(`${label} (${path}) did not include expected text: ${text}`);
    }
  }

  console.log(`[ok] ${label}: ${path}`);
}

async function signIn() {
  const csrfResponse = await fetchWithTimeout("/api/auth/csrf");
  if (!csrfResponse.ok) {
    throw new Error(`/api/auth/csrf returned ${csrfResponse.status}`);
  }

  const { csrfToken } = await csrfResponse.json();
  const body = new URLSearchParams({
    csrfToken,
    email: smokeEmail,
    password: smokePassword,
    callbackUrl: buildUrl("/dashboard/hospital"),
    json: "true",
  });

  const signInResponse = await fetchWithTimeout("/api/auth/callback/credentials?json=true", {
    body,
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });

  if (!signInResponse.ok) {
    throw new Error(`Credentials sign-in returned ${signInResponse.status}`);
  }

  const hasSessionCookie = Array.from(cookieJar.keys()).some((name) => name.includes("session-token"));
  if (!hasSessionCookie) {
    throw new Error("Credentials sign-in did not return a NextAuth session cookie.");
  }

  console.log(`[ok] Signed in as ${smokeEmail}`);
}

async function run() {
  console.log(`Running hospital dashboard smoke checks against ${baseUrl}`);

  await assertPublicDemo("/dashboard/hospital", [
    "Command Centre Overview",
    "synthetic",
  ]);
  await assertPublicDemo("/dashboard/hospital/wards", ["Ward Status"]);
  await assertPublicDemo("/dashboard/hospital/capacity", ["Capacity Forecast"]);
  await assertPublicDemo("/dashboard/hospital/staffing", ["Staffing"]);

  // Credentials optional — public demo is the primary contract for this surface.
  if (smokeEmail && smokePassword) {
    console.log("Credentials present — also verifying authenticated hospital session.");
    await signIn();
    for (const route of protectedHospitalRoutes) {
      await assertPage(route);
    }
  } else {
    console.log("[skip] SMOKE_HOSPITAL credentials unset — authenticated pass skipped (public demo ok)");
  }

  console.log(`Hospital dashboard smoke checks passed for ${baseUrl}`);
}

run().catch((error) => {
  console.error("Hospital dashboard smoke checks failed.");
  console.error(error instanceof Error ? error.message : error);
  console.error("Start the app first with `npm run dev` or `npm run build && npm run start`.");
  process.exit(1);
});
