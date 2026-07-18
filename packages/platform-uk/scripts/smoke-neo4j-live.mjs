#!/usr/bin/env node
/**
 * Smoke: Neo4j live graph honesty for dashboards.
 *
 * 1. Public GET /api/health — neo4j.connected / mode
 * 2. When live + SMOKE_* credentials present: patient API must return X-Data-Source: neo4j
 *
 * Usage:
 *   SMOKE_BASE_URL=https://akshhealth.com node scripts/smoke-neo4j-live.mjs
 *   # optional auth for live consumer check:
 *   SMOKE_GP_EMAIL=... SMOKE_GP_PASSWORD=... node scripts/smoke-neo4j-live.mjs
 */

const baseUrl = (process.env.SMOKE_BASE_URL ?? process.env.EVIDENCE_HEALTH_URL ?? "https://akshhealth.com").replace(
  /\/$/,
  ""
);
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS ?? 15_000);
const smokeEmail = process.env.SMOKE_GP_EMAIL ?? process.env.SMOKE_ADMIN_EMAIL ?? "";
const smokePassword = process.env.SMOKE_GP_PASSWORD ?? process.env.SMOKE_ADMIN_PASSWORD ?? "";

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

async function maybeSignIn() {
  if (!smokeEmail || !smokePassword) {
    console.log("[skip] No SMOKE_GP_EMAIL/PASSWORD — authenticated X-Data-Source check skipped");
    return false;
  }

  const csrfResponse = await fetchWithTimeout("/api/auth/csrf");
  if (!csrfResponse.ok) throw new Error(`csrf ${csrfResponse.status}`);
  const { csrfToken } = await csrfResponse.json();
  const body = new URLSearchParams({
    csrfToken,
    email: smokeEmail,
    password: smokePassword,
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
  console.log(`[ok] Signed in as ${smokeEmail}`);
  return true;
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

  const signedIn = await maybeSignIn();
  if (signedIn) {
    const patientRes = await fetchWithTimeout("/api/neo4j/patient?id=P002");
    if (!patientRes.ok) throw new Error(`/api/neo4j/patient → ${patientRes.status}`);
    const source = patientRes.headers.get("X-Data-Source");
    console.log(`[ok] P002 X-Data-Source=${source}`);

    if (neo.mode === "live" && neo.connected) {
      if (source !== "neo4j") {
        throw new Error(
          `Expected X-Data-Source: neo4j when health is live, got ${source ?? "null"} — consumer still on mock`
        );
      }
      console.log("[ok] Signed-in GP consumer receives live Neo4j patient payload");
    } else if (source === "mock") {
      console.log("[ok] Signed-in consumer correctly reports mock fallback");
    }
  }

  console.log("Neo4j live smoke passed");
}

run().catch((error) => {
  console.error("Neo4j live smoke failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
