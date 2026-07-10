import { unlink } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";
const smokeEmail = process.env.SMOKE_LOOP_EMAIL ?? "smoke@akshhealth.com";
const smokePassword = process.env.SMOKE_LOOP_PASSWORD ?? "demo123";
const smokeUserId = process.env.SMOKE_LOOP_USER_ID ?? "user-003";
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS ?? 12_000);
const projectRoot = process.cwd();

const cookieJar = new Map();

function buildUrl(routePath) {
  return new URL(routePath, baseUrl).toString();
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

async function fetchWithTimeout(routePath, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const headers = new Headers(options.headers ?? {});
  const cookies = cookieHeader();

  if (cookies) {
    headers.set("cookie", cookies);
  }

  try {
    const response = await fetch(buildUrl(routePath), {
      ...options,
      headers,
      redirect: "manual",
      signal: controller.signal
    });
    storeCookies(response.headers);
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`${routePath} timed out after ${timeoutMs}ms`);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJson(routePath, options = {}) {
  const response = await fetchWithTimeout(routePath, options);
  const bodyText = await response.text();
  let payload = null;

  try {
    payload = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    payload = bodyText;
  }

  return { response, payload };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function signIn() {
  const csrfResponse = await fetchWithTimeout("/api/auth/csrf");
  assert(csrfResponse.ok, `/api/auth/csrf returned ${csrfResponse.status}`);

  const { csrfToken } = await csrfResponse.json();
  const body = new URLSearchParams({
    csrfToken,
    email: smokeEmail,
    password: smokePassword,
    callbackUrl: buildUrl("/workspace"),
    json: "true"
  });

  const signInResponse = await fetchWithTimeout("/api/auth/callback/credentials?json=true", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body
  });

  assert(signInResponse.ok, `Credentials sign-in returned ${signInResponse.status}`);
  const hasSessionCookie = Array.from(cookieJar.keys()).some((name) => name.includes("session-token"));
  assert(hasSessionCookie, "Credentials sign-in did not return a NextAuth session cookie.");
  console.log(`[ok] Signed in as ${smokeEmail}`);
}

async function cleanupScopeFiles() {
  const targets = [
    `review-cases.${smokeUserId}.json`,
    `feedback-state.${smokeUserId}.json`,
    `benchmark-signoffs.${smokeUserId}.json`,
    `readiness-history.${smokeUserId}.json`
  ];

  await Promise.all(
    targets.map(async (fileName) => {
      try {
        await unlink(path.join(projectRoot, "data", fileName));
      } catch (error) {
        if (error?.code !== "ENOENT") {
          throw error;
        }
      }
    })
  );
}

function createDecisionEvent(reviewerName, reviewerNotes, timestamp) {
  return {
    id: `evt-${Math.random().toString(36).slice(2, 10)}`,
    category: "reviewer_decision",
    label: "Draft accepted",
    actor: reviewerName,
    timestamp,
    detail: reviewerNotes
  };
}

async function run() {
  console.log(`Running mutation loop smoke against ${baseUrl}`);
  await cleanupScopeFiles();

  try {
    await signIn();

    const initialCases = await fetchJson("/api/review-cases");
    assert(initialCases.response.ok, `Initial review-case load returned ${initialCases.response.status}`);
    assert(Array.isArray(initialCases.payload?.cases), "Initial review-case load did not return cases.");
    assert(initialCases.payload.cases.length >= 8, "Initial authenticated scope did not seed review cases.");
    console.log(`[ok] Seeded scope loaded with ${initialCases.payload.cases.length} cases`);

    const createPayload = {
      action: "create",
      patientLabel: "Smoke Loop Patient",
      rawInput: "Stable eczema flare on arms with itching and rash. No infection concerns. Request for hydrocortisone cream repeat.",
      sourceType: "note",
      options: {
        pathwayHint: "eczema",
        confidenceMode: "standard",
        includeMedicationDraft: true,
        sourceProfile: "voice_note_intake"
      }
    };
    const created = await fetchJson("/api/review-cases", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(createPayload)
    });
    assert(created.response.status === 201, `Create case returned ${created.response.status}`);
    const createdCase = created.payload?.reviewCase;
    assert(createdCase?.id, "Create case response did not include an id.");
    assert(createdCase.input?.sourceProfile === "voice_note_intake", "Created case did not persist the synthetic source profile.");
    console.log(`[ok] Created review case ${createdCase.id}`);

    const fetched = await fetchJson(`/api/review-cases/${createdCase.id}`);
    assert(fetched.response.ok, `Fetch case returned ${fetched.response.status}`);
    const reviewCase = fetched.payload?.reviewCase;
    assert(reviewCase?.status === "pending_review", "Created case was not pending review.");
    console.log(`[ok] Fetched pending case ${reviewCase.id}`);

    const decisionAt = new Date().toLocaleString("en-GB");
    const reviewerName = "Smoke Loop Reviewer";
    const reviewerNotes = "Synthetic loop smoke acceptance.";
    const acceptedPayload = {
      ...reviewCase,
      status: "accepted",
      updatedAt: decisionAt,
      auditEvents: [...(reviewCase.auditEvents ?? []), createDecisionEvent(reviewerName, reviewerNotes, decisionAt)],
      reviewSummary: {
        ...(reviewCase.reviewSummary ?? {}),
        lastReviewer: reviewerName,
        lastDecision: "accept",
        lastDecisionAt: decisionAt,
        reviewerNotes,
        overrideReason: ""
      }
    };
    const accepted = await fetchJson(`/api/review-cases/${createdCase.id}`, {
      method: "PUT",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(acceptedPayload)
    });
    assert(accepted.response.ok, `Accept case returned ${accepted.response.status}`);
    assert(accepted.payload?.reviewCase?.status === "accepted", "Accepted case did not persist accepted status.");
    assert(accepted.payload?.reviewCase?.frozenArtifact, "Accepted case did not persist a frozen artifact.");
    console.log(`[ok] Accepted case ${createdCase.id}`);

    const exported = await fetchJson(`/api/review-cases/${createdCase.id}/export`);
    assert(exported.response.ok, `Case export returned ${exported.response.status}`);
    assert(exported.payload?.artifactState === "frozen", "Accepted case export was not frozen.");
    assert(exported.payload?.finalizationState === "ready", "Accepted case export was not ready.");
    console.log(`[ok] Exported frozen evidence for ${createdCase.id}`);

    const signoff = await fetchJson("/api/benchmarks/signoff", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        action: "save_signoff",
        draft: {
          reviewerName,
          decision: "accepted_for_internal_evidence",
          notes: "Smoke loop benchmark sign-off."
        }
      })
    });
    assert(signoff.response.ok, `Benchmark sign-off returned ${signoff.response.status}`);
    assert(signoff.payload?.state?.archive?.length === 1, "Benchmark sign-off was not persisted.");
    console.log("[ok] Saved benchmark sign-off");

    const readinessHistory = await fetchJson("/api/readiness/history");
    assert(readinessHistory.response.ok, `Readiness history returned ${readinessHistory.response.status}`);
    assert(readinessHistory.payload?.state?.archive?.length === 1, "Readiness history snapshot was not created.");
    assert(
      readinessHistory.payload.state.archive[0]?.signoff?.decision === "accepted_for_internal_evidence",
      "Readiness history snapshot did not capture benchmark sign-off."
    );
    console.log("[ok] Readiness history captured benchmark sign-off");

    console.log(`Mutation loop smoke passed for ${baseUrl}`);
  } finally {
    await cleanupScopeFiles();
  }
}

run().catch((error) => {
  console.error("Mutation loop smoke failed.");
  console.error(error instanceof Error ? error.message : error);
  console.error("Start the app first with `npm run dev` or `npm run build && npm run start`.");
  process.exit(1);
});