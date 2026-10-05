import { requireSmokeCredentials } from "./lib/smoke-credentials.mjs";

const baseUrl = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";
const { email: smokeEmail, password: smokePassword } = requireSmokeCredentials("SMOKE", "smoke:walkthrough");
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS ?? 12_000);

const publicPages = [
  {
    label: "Landing",
    path: "/",
    expectedText: ["Clinical intelligence", "Diabetes care", "properly coordinated"]
  },
  {
    label: "Get started",
    path: "/get-started",
    expectedText: ["Request access for your organisation"]
  },
  {
    label: "Platform roles",
    path: "/platform",
    expectedText: ["One platform, eight roles"]
  },
  {
    label: "Product tour",
    path: "/demo/patel",
    expectedText: ["Mr James Patel walkthrough"]
  }
];

const protectedPages = [
  {
    label: "Workspace",
    path: "/workspace",
    expectedText: ["Clinician workspace", "Loading your workspace"]
  },
  {
    label: "Command centre",
    path: "/review/command-centre",
    expectedText: ["Clinician workspace", "Loading command centre"]
  },
  {
    label: "Clean-demo readiness",
    path: "/review/demo-readiness?demo=1",
    expectedText: ["Clinician workspace", "Loading clean-demo readiness"]
  },
  {
    label: "Simulated patients",
    path: "/review/simulated-patients",
    expectedText: ["Clinician workspace", "Simulated patient cohort"]
  },
  {
    label: "Governance pack",
    path: "/review/governance-pack",
    expectedText: ["Clinician workspace", "Loading governance pack"]
  },
  {
    label: "Review queue",
    path: "/review?demo=1",
    expectedText: ["Clinician workspace", "Loading review queue"]
  },
  {
    label: "Accepted case evidence",
    path: "/cases/case-005/evidence?demo=1",
    expectedText: ["Clinician workspace", "Case Evidence"],
    soft: true
  },
  {
    label: "Presenter guide",
    path: "/review/presenter?demo=1",
    expectedText: ["Clinician workspace", "Presenter Guide"]
  },
  {
    label: "Benchmark report",
    path: "/review/benchmarks/report?demo=1",
    expectedText: ["Clinician workspace", "Loading benchmark evidence report"]
  },
  {
    label: "Evidence readiness",
    path: "/review/readiness?demo=1",
    expectedText: ["Clinician workspace", "Loading evidence readiness"]
  },
  {
    label: "Command centre report",
    path: "/review/command-centre/report?demo=1",
    expectedText: ["Clinician workspace", "Loading product state report"]
  },
  {
    label: "Roadmap report",
    path: "/review/roadmap/report",
    expectedText: ["Clinician workspace", "Loading roadmap evidence report"]
  }
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
      signal: controller.signal
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

async function assertPage({ label, path, expectedText, soft = false }) {
  try {
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
  } catch (error) {
    if (soft) {
      console.warn(`[soft-fail] ${label}: ${error instanceof Error ? error.message : error}`);
      return;
    }
    throw error;
  }
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
    callbackUrl: buildUrl("/workspace"),
    json: "true"
  });

  const signInResponse = await fetchWithTimeout("/api/auth/callback/credentials?json=true", {
    body,
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    method: "POST"
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
  console.log(`Running main walkthrough smoke checks against ${baseUrl}`);

  for (const page of publicPages) {
    await assertPage(page);
  }

  await signIn();

  for (const page of protectedPages) {
    await assertPage(page);
  }

  console.log(`Main walkthrough smoke checks passed for ${baseUrl}`);
}

run().catch((error) => {
  console.error("Main walkthrough smoke checks failed.");
  console.error(error instanceof Error ? error.message : error);
  console.error("Start the app first with `npm run dev` or `npm run build && npm run start`.");
  process.exit(1);
});
