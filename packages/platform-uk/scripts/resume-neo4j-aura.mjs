#!/usr/bin/env node
/**
 * Resume a paused Neo4j Aura instance via the Aura API.
 *
 * Requires Aura API credentials (Neo4j Aura console → Account → API credentials):
 *   AURA_CLIENT_ID
 *   AURA_CLIENT_SECRET
 *   AURA_INSTANCEID  (default: cbed9e8d from .env.local)
 *
 * Usage:
 *   AURA_CLIENT_ID=... AURA_CLIENT_SECRET=... node scripts/resume-neo4j-aura.mjs
 *   # then wait for Running, verify, and seed if needed:
 *   npm run data:seed:neo4j
 *   curl -s https://akshhealth.com/api/health | jq .neo4j
 */

const instanceId = process.env.AURA_INSTANCEID?.trim() || "cbed9e8d";
const clientId = process.env.AURA_CLIENT_ID?.trim();
const clientSecret = process.env.AURA_CLIENT_SECRET?.trim();

if (!clientId || !clientSecret) {
  console.error(
    "Missing AURA_CLIENT_ID or AURA_CLIENT_SECRET.\n" +
      "Create API credentials at https://console.neo4j.io/ → Account → API credentials,\n" +
      "then run:\n" +
      "  AURA_CLIENT_ID=... AURA_CLIENT_SECRET=... node scripts/resume-neo4j-aura.mjs"
  );
  process.exit(1);
}

async function getBearerToken() {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch("https://api.neo4j.io/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OAuth token failed (${response.status}): ${body}`);
  }

  const payload = (await response.json()) as { access_token?: string };
  if (!payload.access_token) throw new Error("No access_token in OAuth response");
  return payload.access_token;
}

async function getInstanceStatus(token) {
  const response = await fetch(`https://api.neo4j.io/v1/instances/${instanceId}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Get instance failed (${response.status}): ${body}`);
  }

  return response.json();
}

async function resumeInstance(token) {
  const response = await fetch(`https://api.neo4j.io/v1/instances/${instanceId}/resume`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resume failed (${response.status}): ${body}`);
  }
}

async function waitForRunning(token, maxWaitMs = 180_000) {
  const started = Date.now();
  while (Date.now() - started < maxWaitMs) {
    const instance = await getInstanceStatus(token);
    const status = String(instance.status ?? "").toLowerCase();
    console.log(`  status: ${status}`);
    if (status === "running") return instance;
    if (status === "failed" || status === "destroyed") {
      throw new Error(`Instance entered ${status} state`);
    }
    await new Promise((r) => setTimeout(r, 10_000));
  }
  throw new Error(`Timed out waiting for Running after ${maxWaitMs / 1000}s`);
}

async function main() {
  console.log(`Neo4j Aura resume — instance ${instanceId}`);
  const token = await getBearerToken();

  const before = await getInstanceStatus(token);
  console.log(`Current status: ${before.status ?? "unknown"} (${before.name ?? "unnamed"})`);

  const status = String(before.status ?? "").toLowerCase();
  if (status === "running") {
    console.log("Already running — no resume needed.");
    return;
  }

  console.log("Sending resume request…");
  await resumeInstance(token);
  console.log("Waiting for Running (up to 3 minutes)…");
  const after = await waitForRunning(token);
  console.log(`Instance is ${after.status}. Next: npm run data:seed:neo4j && curl https://akshhealth.com/api/health`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
