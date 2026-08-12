import { requireSmokeCredentials } from "./lib/smoke-credentials.mjs";

/**
 * ICS Lead dashboard smoke checks.
 *
 * Requires a running app (`npm run dev` or `npm run build && npm run start`).
 *
 * Auth: set credentials for a real account created via /signup:
 *   SMOKE_ICS_EMAIL=you@example.com
 *   SMOKE_ICS_PASSWORD=your-password
 *   SMOKE_BASE_URL=http://127.0.0.1:3000
 */

const baseUrl = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";
const { email: smokeEmail, password: smokePassword } = requireSmokeCredentials("SMOKE_ICS", "smoke:ics");
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS ?? 12_000);

const protectedIcsRoutes = [
  {
    label: "ICS overview",
    path: "/dashboard/ics",
    expectedText: [
      "Population intelligence",
      "Total Patients",
      "liveEmis:false",
      "no patient-level spill",
      "COMPASS",
      "Ask Aksh",
    ],
  },
  {
    label: "ICS population",
    path: "/dashboard/ics/population",
    expectedText: [
      "Population Health",
      "Patient Risk Profile Across ICS",
      "liveEmis:false",
      "Diabetes population signal",
    ],
  },
  {
    label: "ICS equity",
    path: "/dashboard/ics/equity",
    expectedText: ["Equity Metrics", "COMPASS Deep-Dive", "liveEmis:false"],
  },
  {
    label: "ICS benchmarking",
    path: "/dashboard/ics/benchmarking",
    expectedText: ["Practice Benchmarking", "Download Board Report"],
  },
  {
    label: "ICS forecast",
    path: "/dashboard/ics/forecast",
    expectedText: ["Admission Forecast", "Population risk state", "not a physiological twin"],
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

async function assertPublicIcsDemo() {
  const response = await fetchWithTimeout("/dashboard/ics");
  if (!response.ok) {
    throw new Error(`Public ICS demo returned ${response.status}`);
  }
  const html = await response.text();
  for (const text of [
    "Population intelligence",
    "liveEmis:false",
    "Synthetic ICS cohorts",
    "no patient-level spill",
    "Ask Aksh",
  ]) {
    if (!html.includes(text)) {
      throw new Error(`Public ICS demo missing expected text: ${text}`);
    }
  }
  console.log("[ok] Public ICS demo is reachable without auth");

  const api = await fetchWithTimeout("/api/neo4j/ics-population");
  if (!api.ok) throw new Error(`Public ics-population → ${api.status}`);
  const source = api.headers.get("X-Data-Source");
  if (source !== "demo") {
    throw new Error(`Public ICS API expected X-Data-Source: demo, got ${source ?? "null"}`);
  }
  console.log("[ok] Public ICS API returns synthetic demo header");
}

async function assertAuthenticatedIcsNeo4jHonesty() {
  const api = await fetchWithTimeout("/api/neo4j/ics-population");
  if (!api.ok) throw new Error(`Authenticated ics-population → ${api.status}`);
  const source = api.headers.get("X-Data-Source");
  if (source !== "neo4j" && source !== "mock") {
    throw new Error(`Authenticated ICS expected neo4j|mock, got ${source ?? "null"}`);
  }
  console.log(`[ok] Authenticated ICS X-Data-Source=${source}`);
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
    callbackUrl: buildUrl("/dashboard/ics"),
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
  console.log(`Running ICS dashboard smoke checks against ${baseUrl}`);
  console.log("Note: authenticated route checks require a valid session cookie from configured credentials.");

  await assertPublicIcsDemo();

  await signIn();
  await assertAuthenticatedIcsNeo4jHonesty();

  for (const route of protectedIcsRoutes) {
    await assertPage(route);
  }

  console.log(`ICS dashboard smoke checks passed for ${baseUrl}`);
}

run().catch((error) => {
  console.error("ICS dashboard smoke checks failed.");
  console.error(error instanceof Error ? error.message : error);
  console.error("Start the app first with `npm run dev` or `npm run build && npm run start`.");
  process.exit(1);
});
