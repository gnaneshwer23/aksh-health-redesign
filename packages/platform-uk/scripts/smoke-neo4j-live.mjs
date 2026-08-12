#!/usr/bin/env node
/**
 * Smoke: Neo4j live graph honesty for dashboards.
 *
 * 1. Public GET /api/health — neo4j.connected / mode
 * 2. Authenticated patient/guardian APIs must return X-Data-Source: neo4j when Aura live
 * 3. Public ICS population stays synthetic (X-Data-Source: demo)
 *
 * Auth:
 *   Optional override (preferred for CI with known accounts):
 *     SMOKE_GP_EMAIL=... SMOKE_GP_PASSWORD=...
 *   Otherwise creates a throwaway GP via POST /api/auth/signup (same pattern as e2e helpers).
 *   Override throwaway password with E2E_TEST_PASSWORD (default E2eTestPass1!).
 *
 * Usage:
 *   SMOKE_BASE_URL=https://akshhealth.com npm run smoke:neo4j
 *   SMOKE_GP_EMAIL=... SMOKE_GP_PASSWORD=... npm run smoke:neo4j
 */

// Side-effect: load .env.local SMOKE_* before reading overrides
import "./lib/smoke-credentials.mjs";

const baseUrl = (process.env.SMOKE_BASE_URL ?? process.env.EVIDENCE_HEALTH_URL ?? "https://akshhealth.com").replace(
  /\/$/,
  ""
);
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS ?? 15_000);
const overrideEmail = process.env.SMOKE_GP_EMAIL ?? process.env.SMOKE_ADMIN_EMAIL ?? "";
const overridePassword = process.env.SMOKE_GP_PASSWORD ?? process.env.SMOKE_ADMIN_PASSWORD ?? "";
const throwawayPassword = process.env.E2E_TEST_PASSWORD?.trim() || "E2eTestPass1!";

const cookieJar = new Map();

function cookieHeader() {
  return Array.from(cookieJar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

function storeCookies(response) {
  const raw = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
  const single = response.headers.get("set-cookie");
  const list = raw.length > 0 ? raw : single ? [single] : [];
  for (const entry of list) {
    const [pair] = entry.split(";");
    const eq = pair.indexOf("=");
    if (eq > 0) cookieJar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
  }
}

async function fetchWithTimeout(path, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        ...(init.headers ?? {}),
        ...(cookieJar.size > 0 ? { cookie: cookieHeader() } : {})
      }
    });
    storeCookies(response);
    return response;
  } finally {
    clearTimeout(timer);
  }
}

function uniqueSmokeEmail() {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `smoke+neo4j-gp+${stamp}@akshhealth.test`;
}

async function createThrowawayGp() {
  const email = uniqueSmokeEmail();
  const password = throwawayPassword;
  const response = await fetchWithTimeout("/api/auth/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      confirmPassword: password,
      role: "gp",
      fullName: "Neo4j Smoke GP",
      acceptedTerms: true
    })
  });
  if (response.status !== 201) {
    const body = await response.text();
    throw new Error(`Throwaway GP signup failed (${response.status}): ${body.slice(0, 400)}`);
  }
  console.log(`[ok] Created throwaway GP ${email}`);
  return { email, password, created: true };
}

async function resolveSmokeCredentials() {
  if (overrideEmail && overridePassword) {
    console.log(`[ok] Using SMOKE_GP_* override for ${overrideEmail}`);
    return { email: overrideEmail, password: overridePassword, created: false };
  }
  console.log("[info] No SMOKE_GP_EMAIL/PASSWORD — creating throwaway GP via /api/auth/signup");
  return createThrowawayGp();
}

async function signIn(email, password) {
  const csrfResponse = await fetchWithTimeout("/api/auth/csrf");
  if (!csrfResponse.ok) throw new Error(`csrf ${csrfResponse.status}`);
  const { csrfToken } = await csrfResponse.json();
  const body = new URLSearchParams({
    csrfToken,
    email,
    password,
    callbackUrl: `${baseUrl}/dashboard/gp`,
    json: "true"
  });
  const signInResponse = await fetchWithTimeout("/api/auth/callback/credentials?json=true", {
    method: "POST",
    body,
    headers: { "content-type": "application/x-www-form-urlencoded" }
  });
  if (!signInResponse.ok) throw new Error(`sign-in ${signInResponse.status}`);
  const hasSession = Array.from(cookieJar.keys()).some((name) => name.includes("session-token"));
  if (!hasSession) throw new Error("No session cookie after sign-in");
  console.log(`[ok] Signed in as ${email}`);
}

async function run() {
  console.log(`Neo4j live smoke against ${baseUrl}`);

  const healthRes = await fetchWithTimeout("/api/health");
  if (!healthRes.ok) throw new Error(`/api/health → ${healthRes.status}`);
  const health = await healthRes.json();
  const neo = health.neo4j ?? {};
  console.log(`[ok] /api/health neo4j.connected=${neo.connected} mode=${neo.mode}`);

  if (neo.mode === "live") {
    if (!neo.connected) {
      throw new Error("neo4j.mode is live but connected is false — dishonest health payload");
    }
    console.log("[ok] Health reports live graph");
  } else {
    console.log(`[ok] Honest mock/fallback mode (connected=${Boolean(neo.connected)})`);
  }

  // Public ICS must stay synthetic demo (no auth)
  cookieJar.clear();
  const publicIcs = await fetchWithTimeout("/api/neo4j/ics-population");
  if (!publicIcs.ok) throw new Error(`public ics-population → ${publicIcs.status}`);
  const publicSource = publicIcs.headers.get("X-Data-Source");
  if (publicSource !== "demo") {
    throw new Error(`Public ICS expected X-Data-Source: demo, got ${publicSource ?? "null"}`);
  }
  console.log("[ok] Public ICS population is synthetic demo");

  const { email, password } = await resolveSmokeCredentials();
  await signIn(email, password);

  const patientRes = await fetchWithTimeout("/api/neo4j/patient?id=P002");
  if (!patientRes.ok) throw new Error(`/api/neo4j/patient → ${patientRes.status}`);
  const patientSource = patientRes.headers.get("X-Data-Source");
  console.log(`[ok] P002 X-Data-Source=${patientSource}`);

  const guardianRes = await fetchWithTimeout("/api/neo4j/guardian?patientId=P002");
  if (!guardianRes.ok) throw new Error(`/api/neo4j/guardian → ${guardianRes.status}`);
  const guardianSource = guardianRes.headers.get("X-Data-Source");
  console.log(`[ok] Guardian P002 X-Data-Source=${guardianSource}`);

  const authIcs = await fetchWithTimeout("/api/neo4j/ics-population");
  if (!authIcs.ok) throw new Error(`auth ics-population → ${authIcs.status}`);
  const authIcsSource = authIcs.headers.get("X-Data-Source");
  console.log(`[ok] Authenticated ICS X-Data-Source=${authIcsSource}`);

  if (neo.mode === "live" && neo.connected) {
    if (patientSource !== "neo4j") {
      throw new Error(
        `Expected patient X-Data-Source: neo4j when health is live, got ${patientSource ?? "null"}`
      );
    }
    if (guardianSource !== "neo4j") {
      throw new Error(
        `Expected guardian X-Data-Source: neo4j when health is live, got ${guardianSource ?? "null"}`
      );
    }
    if (authIcsSource !== "neo4j") {
      throw new Error(
        `Expected authenticated ICS X-Data-Source: neo4j when health is live, got ${authIcsSource ?? "null"}`
      );
    }
    console.log("[ok] Signed-in consumer receives live Neo4j patient/guardian/ICS payloads");
  } else {
    if (patientSource === "mock" && guardianSource === "mock") {
      console.log("[ok] Signed-in consumer correctly reports mock fallback");
    }
    if (authIcsSource === "mock") {
      console.log("[ok] Authenticated ICS correctly reports mock fallback");
    }
  }

  console.log("Neo4j live smoke passed");
}

run().catch((error) => {
  console.error("Neo4j live smoke failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
