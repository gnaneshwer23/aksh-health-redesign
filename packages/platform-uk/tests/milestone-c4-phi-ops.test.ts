/**
 * Milestone C4 — residual lifestyle PHI scrub + optional no-PHI ops alert channel.
 * Synthetic / controlled data only. Does not claim clinical validation or pager certification.
 */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const root = path.join(__dirname, "..");
const tmp = mkdtempSync(path.join(tmpdir(), "c4-phi-ops-"));
const prevCwd = process.cwd();
const prevDbUrl = process.env.DATABASE_URL;
const prevUsePg = process.env.USE_POSTGRES;
delete process.env.DATABASE_URL;
delete process.env.USE_POSTGRES;
process.chdir(tmp);

function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

/** Fail if lifestyle agent routes reintroduce label-shaped resourceRef templates. */
function assertNoLabelShapedResourceRef(src: string, fileLabel: string) {
  assert.doesNotMatch(
    src,
    /resourceRef:\s*`\$\{patientLabel\}.*\$\{patientId\}/,
    `${fileLabel} must not use label-shaped resourceRef template`
  );
  assert.doesNotMatch(
    src,
    /resourceRef:\s*result\.escalation\.patientLabel/,
    `${fileLabel} must not audit patientLabel as resourceRef`
  );
  assert.match(src, /phiSafeResourceRef/, `${fileLabel} must use phiSafeResourceRef`);
}

async function main() {
  // --- Docs ---
  const doc = read("docs/milestone-c/PHI_OPS_ALERT.md");
  assert.match(doc, /What was scrubbed/);
  assert.match(doc, /Ops alert channel/);
  assert.match(doc, /dual-path/i);
  assert.match(doc, /AKSH_OPS_ALERT_CHANNEL_ENABLED/);
  assert.match(doc, /productionRbacEnforced/);
  assert.match(doc, /test:milestone-c:phi-ops/);
  assert.match(doc, /clinical validation/i);
  assert.match(doc, /Gaps for C5/);
  assert.match(doc, /no PHI|PHI-free|opaque/i);

  const c1 = read("docs/milestone-c/FACILITATOR_SESSION.md");
  assert.match(c1, /PHI_OPS_ALERT|Milestone C4/);

  const a4Sec = read("docs/milestone-a/SECURITY_AND_PRIVACY.md");
  assert.match(a4Sec, /C4|PHI_OPS_ALERT|lifestyle/);

  // --- Lifestyle route scrub ---
  const lifestyleRoutes = [
    "app/api/agents/sleep/route.ts",
    "app/api/agents/nutrition/route.ts",
    "app/api/agents/exercise/route.ts",
    "app/api/agents/mental-health/route.ts",
    "app/api/agents/referral/route.ts",
    "app/api/agents/voice-care/route.ts",
  ];
  for (const rel of lifestyleRoutes) {
    assertNoLabelShapedResourceRef(read(rel), rel);
  }

  const coaching = read("components/dashboard/precision-health/CoachingDraftPanel.tsx");
  assert.doesNotMatch(
    coaching,
    /resourceRef:\s*`\$\{patientLabel/,
    "CoachingDraftPanel must not post label-shaped resourceRef"
  );

  const auditRoute = read("app/api/audit/shield/route.ts");
  assert.match(auditRoute, /normaliseAuditResourceRef/);

  // --- phi-safe helpers ---
  const {
    phiSafeResourceRef,
    looksLikeLabelShapedResourceRef,
    normaliseAuditResourceRef,
    isOpaquePhiSafeRef,
  } = await import("../lib/security/phi-safe-ref");

  assert.equal(looksLikeLabelShapedResourceRef("Alice Example (P001)"), true);
  assert.equal(looksLikeLabelShapedResourceRef("Mrs Johnson"), true);
  assert.equal(looksLikeLabelShapedResourceRef("P002"), true);
  const opaque = phiSafeResourceRef("P002", { agentLabel: "SLEEP" });
  assert.equal(isOpaquePhiSafeRef(opaque), true);
  assert.equal(looksLikeLabelShapedResourceRef(opaque), false);
  assert.doesNotMatch(opaque, /Alice|Mrs|P002|Johnson/);

  const normalised = normaliseAuditResourceRef("Alice Example (P-SECRET-99)", {
    agentLabel: "NUTRITION",
  });
  assert.equal(isOpaquePhiSafeRef(normalised), true);
  assert.doesNotMatch(normalised, /Alice|SECRET|P-SECRET/);
  assert.match(normalised, /NUTRITION/);

  // Regression: lifestyle payload-shaped strings must not survive normalisation
  for (const bad of [
    "Jane Doe (P001)",
    "Mrs Johnson",
    "ward A / Bay 3",
    "P001",
  ]) {
    const scrubbed = normaliseAuditResourceRef(bad, { agentLabel: "EXERCISE" });
    assert.equal(looksLikeLabelShapedResourceRef(scrubbed), false, bad);
    assert.doesNotMatch(scrubbed, /Jane|Johnson|ward|P001/);
  }

  // --- Ops alert channel ---
  const channelSrc = read("lib/agents/ops-alert-channel.ts");
  assert.match(channelSrc, /AKSH_OPS_ALERT_CHANNEL_ENABLED/);
  assert.match(channelSrc, /phiLeakage:\s*false/);
  assert.match(channelSrc, /certificationClaim:\s*false/);
  assert.match(channelSrc, /dualPathResidual/);

  const envExample = read(".env.example");
  assert.match(envExample, /AKSH_OPS_ALERT_CHANNEL_ENABLED/);
  assert.match(envExample, /AKSH_OPS_ALERT_WEBHOOK_URL/);

  const {
    buildOpsAlertChannelPayload,
    dispatchOpsAlertChannel,
    resetOpsAlertChannelThrottleForTests,
    isOpsAlertChannelEnabled,
  } = await import("../lib/agents/ops-alert-channel");
  const { evaluateDurableRunAlerts } = await import("../lib/agents/ops-alerts");

  const prevEnabled = process.env.AKSH_OPS_ALERT_CHANNEL_ENABLED;
  const prevUrl = process.env.AKSH_OPS_ALERT_WEBHOOK_URL;
  const prevMin = process.env.AKSH_OPS_ALERT_MIN_SEVERITY;
  const prevThrottle = process.env.AKSH_OPS_ALERT_CHANNEL_THROTTLE_MS;
  delete process.env.AKSH_OPS_ALERT_CHANNEL_ENABLED;
  delete process.env.AKSH_OPS_ALERT_WEBHOOK_URL;
  assert.equal(isOpsAlertChannelEnabled(), false);

  const empty = evaluateDurableRunAlerts([]);
  const disabled = await dispatchOpsAlertChannel({ ...empty, scopeKey: "c4-test" });
  assert.equal(disabled.dispatched, false);
  assert.equal(disabled.reason, "disabled");

  process.env.AKSH_OPS_ALERT_CHANNEL_ENABLED = "true";
  process.env.AKSH_OPS_ALERT_WEBHOOK_URL = "https://hooks.example/aksh-ops-test";
  process.env.AKSH_OPS_ALERT_MIN_SEVERITY = "warning";
  process.env.AKSH_OPS_ALERT_CHANNEL_THROTTLE_MS = "0";
  resetOpsAlertChannelThrottleForTests();

  const now = new Date("2026-11-01T12:00:00.000Z");
  const { claimOrRecoverDurableAgentRun, finalizeDurableAgentRun, resetDurableAgentRunStoreForTests } =
    await import("../lib/agents/execution-run-store");
  const scope = "c4-phi-ops";
  await resetDurableAgentRunStoreForTests(scope);
  for (let i = 0; i < 3; i++) {
    const claim = await claimOrRecoverDurableAgentRun({
      scopeKey: scope,
      patientId: "Alice-Should-Not-Leak",
      patientLabel: "SHOULD_NEVER_APPEAR",
      correlationId: `c4-corr-${i}`,
      idempotencyKey: `c4-idem-${i}-${Date.now()}`,
      organisationId: "practice-c4",
    });
    assert.equal(claim.outcome, "claimed");
    await finalizeDurableAgentRun({
      ...claim.record,
      status: "failed",
      completedAt: now.toISOString(),
      draftEnqueueAllowed: false,
      shieldAuditPersisted: true,
      execution: {
        ...claim.record.execution,
        status: "failed",
        completedAt: now.toISOString(),
        durationMs: 1,
        errorCode: "INTERNAL",
        errorMessage: "fixture",
      },
    });
  }

  const { buildOpsAlerts } = await import("../lib/agents/ops-alerts");
  const summary = await buildOpsAlerts({
    scopeKey: scope,
    now,
    dispatchChannel: false,
  });
  assert.ok(summary.alerts.some((a) => a.code === "REPEATED_AGENT_FAILURES"));
  const blob = JSON.stringify(summary);
  assert.doesNotMatch(blob, /SHOULD_NEVER_APPEAR|Alice-Should-Not-Leak/);

  const payload = buildOpsAlertChannelPayload(summary);
  assert.equal(payload.phiLeakage, false);
  assert.equal(payload.certificationClaim, false);
  assert.equal(payload.dualPathResidual, "file_vs_neon_ops");
  assert.ok(payload.alertCount >= 1);
  const payloadBlob = JSON.stringify(payload);
  assert.doesNotMatch(payloadBlob, /SHOULD_NEVER_APPEAR|Alice-Should-Not-Leak|patientLabel|nhsNumber/i);
  for (const alert of payload.alerts) {
    for (const ref of alert.sampleRefs) {
      assert.match(ref, /^pt_[a-f0-9]{8}/i);
    }
  }

  let postedBody = "";
  const result = await dispatchOpsAlertChannel(summary, {
    fetchImpl: (async (_url, init) => {
      postedBody = String(init?.body ?? "");
      return new Response("ok", { status: 200 });
    }) as typeof fetch,
  });
  assert.equal(result.dispatched, true);
  assert.equal(result.reason, "ok");
  assert.doesNotMatch(postedBody, /SHOULD_NEVER_APPEAR|Alice-Should-Not-Leak|Mrs Johnson/);
  assert.doesNotMatch(postedBody, /\bNHS\s+\d/);

  // Throttle: second dispatch with same fingerprint should be throttled when throttle > 0
  process.env.AKSH_OPS_ALERT_CHANNEL_THROTTLE_MS = "60000";
  const throttled = await dispatchOpsAlertChannel(summary, {
    fetchImpl: (async () => new Response("ok", { status: 200 })) as typeof fetch,
  });
  assert.equal(throttled.dispatched, false);
  assert.equal(throttled.reason, "throttled");

  // Restore env
  if (prevEnabled === undefined) delete process.env.AKSH_OPS_ALERT_CHANNEL_ENABLED;
  else process.env.AKSH_OPS_ALERT_CHANNEL_ENABLED = prevEnabled;
  if (prevUrl === undefined) delete process.env.AKSH_OPS_ALERT_WEBHOOK_URL;
  else process.env.AKSH_OPS_ALERT_WEBHOOK_URL = prevUrl;
  if (prevMin === undefined) delete process.env.AKSH_OPS_ALERT_MIN_SEVERITY;
  else process.env.AKSH_OPS_ALERT_MIN_SEVERITY = prevMin;
  if (prevThrottle === undefined) delete process.env.AKSH_OPS_ALERT_CHANNEL_THROTTLE_MS;
  else process.env.AKSH_OPS_ALERT_CHANNEL_THROTTLE_MS = prevThrottle;

  console.log("milestone-c4-phi-ops: lifestyle PHI scrub + ops alert channel — PASS");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    process.chdir(prevCwd);
    if (prevDbUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = prevDbUrl;
    if (prevUsePg === undefined) delete process.env.USE_POSTGRES;
    else process.env.USE_POSTGRES = prevUsePg;
    try {
      rmSync(tmp, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  });
