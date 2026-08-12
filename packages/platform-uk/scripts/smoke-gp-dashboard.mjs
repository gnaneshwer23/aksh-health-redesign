import { requireSmokeCredentials } from "./lib/smoke-credentials.mjs";

/**
 * GP dashboard smoke checks.
 *
 * Requires a running app (`npm run dev` or `npm run build && npm run start`).
 *
 * Public demo allowlist: `/dashboard/gp*` is open without auth (synthetic data),
 * same pattern as ICS/hospital. Credentials still required for the authenticated pass.
 *
 * Auth: set credentials for a real account created via /signup:
 *   SMOKE_GP_EMAIL=you@example.com
 *   SMOKE_GP_PASSWORD=your-password
 *   SMOKE_BASE_URL=http://127.0.0.1:3000
 */

const baseUrl = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";
const { email: smokeEmail, password: smokePassword } = requireSmokeCredentials("SMOKE_GP", "smoke:gp");
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS ?? 12_000);

const protectedGpRoutes = [
  { label: "GP dashboard", path: "/dashboard/gp", expectedText: ["Clinician Dashboard", "Review Queue"] },
  { label: "GP patients", path: "/dashboard/gp/patients", expectedText: ["My Patients", "Search patients"] },
  { label: "GP review queue", path: "/dashboard/gp/review-queue", expectedText: ["Review Queue"] },
  { label: "GP care pathways", path: "/dashboard/gp/care-pathways", expectedText: ["Care Pathway", "Active Care Pathways"] },
  { label: "GP reports", path: "/dashboard/gp/reports", expectedText: ["Summary Reports", "Consultations This Week"] },
  { label: "GP settings", path: "/dashboard/gp/settings", expectedText: ["AI agent preferences", "SYNTHESIS summary length"] },
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
  if (!response.ok) {
    throw new Error(`Public GP demo ${path} returned ${response.status}`);
  }
  const html = await response.text();
  for (const text of expectedSnippets) {
    if (!html.includes(text)) {
      throw new Error(`Public GP demo ${path} missing expected text: ${text}`);
    }
  }
  console.log(`[ok] Public GP demo reachable without auth: ${path}`);
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
    callbackUrl: buildUrl("/dashboard/gp"),
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
  console.log(`Running GP dashboard smoke checks against ${baseUrl}`);
  console.log("Note: authenticated route checks require a valid session cookie from configured credentials.");

  await assertPublicDemo("/dashboard/gp", ["Clinician Dashboard", "Review Queue"]);

  await signIn();

  for (const route of protectedGpRoutes) {
    await assertPage(route);
  }

  console.log(`GP dashboard smoke checks passed for ${baseUrl}`);
}

run().catch((error) => {
  console.error("GP dashboard smoke checks failed.");
  console.error(error instanceof Error ? error.message : error);
  console.error("Start the app first with `npm run dev` or `npm run build && npm run start`.");
  process.exit(1);
});
