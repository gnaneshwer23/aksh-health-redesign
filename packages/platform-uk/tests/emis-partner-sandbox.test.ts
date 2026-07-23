/**
 * N5 — Partner sandbox honesty tests.
 * Invariants: liveEmis always false · env cannot flip live · certified unlocks rejected ·
 * flag off = sim · flag on without creds = needs_partner.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  attemptEmisPartnerSandboxWrite,
  getEmisPartnerSandboxStatus,
  isEmisPartnerSandboxFlagEnabled,
  listMissingEmisPartnerEnv,
  probeEmisPartnerSandboxOAuth
} from "../lib/emis-partner-sandbox";
import {
  canFlipLiveEmisInCode,
  buildPartnerReadinessPack,
  SPINE_PARTNER_HONESTY
} from "../lib/clinical-spine/partner-readiness";
import { getEmisIntegrationStatus, queueEmisFhirStaging } from "../lib/emis-staging";
import { getEmisPartnerChecklist } from "../lib/precision-health/emis-partner-checklist";

function withEnv(overrides: Record<string, string | undefined>, fn: () => void | Promise<void>) {
  const prev: Record<string, string | undefined> = {};
  for (const key of Object.keys(overrides)) {
    prev[key] = process.env[key];
    const next = overrides[key];
    if (next === undefined) delete process.env[key];
    else process.env[key] = next;
  }
  return Promise.resolve(fn()).finally(() => {
    for (const key of Object.keys(overrides)) {
      const v = prev[key];
      if (v === undefined) delete process.env[key];
      else process.env[key] = v;
    }
  });
}

async function run() {
  assert.equal(SPINE_PARTNER_HONESTY.liveEmis, false);
  assert.equal(canFlipLiveEmisInCode(), false);

  // --- Flag off (default) = sim path ---
  await withEnv(
    {
      ENABLE_EMIS_PARTNER_SANDBOX: undefined,
      EMIS_PARTNER_CLIENT_ID: undefined,
      EMIS_PARTNER_CLIENT_SECRET: undefined,
      EMIS_PARTNER_TOKEN_URL: undefined,
      EMIS_PARTNER_FHIR_BASE_URL: undefined
    },
    () => {
      assert.equal(isEmisPartnerSandboxFlagEnabled(), false);
      const status = getEmisPartnerSandboxStatus();
      assert.equal(status.liveEmis, false);
      assert.equal(status.liveWriteBack, false);
      assert.equal(status.canFlipLiveEmisFromEnv, false);
      assert.equal(status.mode, "disabled");
      assert.equal(status.writePath, "sim");
      assert.equal(status.credentialsConfigured, false);
      assert.ok(listMissingEmisPartnerEnv().length === 4);

      const write = attemptEmisPartnerSandboxWrite({
        hitlAccepted: true,
        bundleSummary: "test"
      });
      assert.equal(write.liveEmis, false);
      assert.equal(write.ehrWriteAttempted, false);
      assert.equal(write.reason, "flag_off_sim_path");
      assert.equal(write.writePath, "sim");
    }
  );

  // --- Flag on without creds = needs_partner ---
  await withEnv(
    {
      ENABLE_EMIS_PARTNER_SANDBOX: "true",
      EMIS_PARTNER_CLIENT_ID: undefined,
      EMIS_PARTNER_CLIENT_SECRET: undefined,
      EMIS_PARTNER_TOKEN_URL: undefined,
      EMIS_PARTNER_FHIR_BASE_URL: undefined
    },
    async () => {
      const status = getEmisPartnerSandboxStatus();
      assert.equal(status.mode, "needs_partner");
      assert.equal(status.writePath, "blocked_needs_partner");
      assert.equal(status.liveEmis, false);
      assert.ok(status.missingEnv.includes("EMIS_PARTNER_CLIENT_ID"));

      const writeNoHitl = attemptEmisPartnerSandboxWrite({ hitlAccepted: false });
      assert.equal(writeNoHitl.reason, "missing_hitl_accept");
      assert.equal(writeNoHitl.liveEmis, false);

      const write = attemptEmisPartnerSandboxWrite({ hitlAccepted: true });
      assert.equal(write.reason, "needs_partner");
      assert.equal(write.writePath, "blocked_needs_partner");
      assert.equal(write.ehrWriteAttempted, false);

      const oauth = await probeEmisPartnerSandboxOAuth(async () => {
        throw new Error("should not fetch without creds");
      });
      assert.equal(oauth.attempted, false);
      assert.equal(oauth.mode, "needs_partner");
      assert.equal(oauth.liveEmis, false);
    }
  );

  // --- Flag on + creds ≠ liveEmis flip; network write deferred ---
  await withEnv(
    {
      ENABLE_EMIS_PARTNER_SANDBOX: "true",
      EMIS_PARTNER_CLIENT_ID: "sandbox-client",
      EMIS_PARTNER_CLIENT_SECRET: "sandbox-secret",
      EMIS_PARTNER_TOKEN_URL: "https://sandbox.example/oauth/token",
      EMIS_PARTNER_FHIR_BASE_URL: "https://sandbox.example/fhir/R4"
    },
    async () => {
      const status = getEmisPartnerSandboxStatus();
      assert.equal(status.mode, "sandbox_ready");
      assert.equal(status.writePath, "sandbox");
      assert.equal(status.liveEmis, false);
      assert.equal(status.canFlipLiveEmisFromEnv, false);
      assert.equal(canFlipLiveEmisInCode(), false);

      const write = attemptEmisPartnerSandboxWrite({
        hitlAccepted: true,
        bundleSummary: "sandbox defer"
      });
      assert.equal(write.liveEmis, false);
      assert.equal(write.ehrWriteAttempted, false);
      assert.equal(write.reason, "sandbox_network_deferred");

      const oauthOk = await probeEmisPartnerSandboxOAuth(async () =>
        new Response(JSON.stringify({ access_token: "x", token_type: "bearer" }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
      );
      assert.equal(oauthOk.ok, true);
      assert.equal(oauthOk.liveEmis, false);
      assert.equal(oauthOk.mode, "sandbox_ready");

      const oauthFail = await probeEmisPartnerSandboxOAuth(async () =>
        new Response("invalid_client", { status: 401 })
      );
      assert.equal(oauthFail.ok, false);
      assert.equal(oauthFail.liveEmis, false);
      assert.equal(oauthFail.mode, "sandbox_probe_failed");
    }
  );

  // --- Staging + checklist honesty ---
  await withEnv({ ENABLE_EMIS_PARTNER_SANDBOX: undefined }, () => {
    const staging = getEmisIntegrationStatus();
    assert.equal(staging.liveEmis, false);
    assert.equal(staging.enabled, false);
    assert.equal(staging.sandbox.mode, "disabled");
    assert.equal(staging.sandbox.canFlipLiveEmisFromEnv, false);

    const queued = queueEmisFhirStaging({
      approvedBy: "n5@aksh.health",
      bundleSummary: "n5 queue"
    });
    assert.equal(queued.liveEmis, false);
    assert.equal(queued.ehrWriteAttempted, false);
    assert.equal(queued.status, "queued_internal");

    const checklist = getEmisPartnerChecklist();
    assert.equal(checklist.liveEmis, false);
    assert.equal(checklist.sandbox.mode, "disabled");
    assert.ok(checklist.items.some((i) => i.id === "partner-sandbox"));
    assert.equal(
      checklist.liveEmisFlipRequirements.find((i) => i.id === "flip-go-nogo")?.status,
      "blocked"
    );

    const pack = buildPartnerReadinessPack();
    assert.equal(pack.honesty.liveEmis, false);
    assert.equal(pack.sandbox.liveEmis, false);
    assert.equal(pack.gateArtifacts.anyCertified, false);
    assert.ok(pack.tracks.find((t) => t.id === "emis_systmone")?.uiStatus === "needs_partner");
  });

  // --- Routes / UI / docs structural locks ---
  const sandboxRoute = fs.readFileSync(
    path.join(process.cwd(), "app/api/integrations/emis-partner-sandbox/route.ts"),
    "utf8"
  );
  assert.ok(sandboxRoute.includes("liveEmis: false"));
  assert.ok(sandboxRoute.includes("body.liveEmis === true"));
  assert.ok(sandboxRoute.includes("canFlipLiveEmisInCode"));

  const gatesRoute = fs.readFileSync(
    path.join(process.cwd(), "app/api/clinical-spine/partner-gates/route.ts"),
    "utf8"
  );
  assert.ok(gatesRoute.includes("certified === true"));
  assert.ok(gatesRoute.includes("unlocksLiveEmis"));

  const panel = fs.readFileSync(
    path.join(
      process.cwd(),
      "components/dashboard/precision-health/PartnerReadinessPanel.tsx"
    ),
    "utf8"
  );
  assert.ok(panel.includes("partner-sandbox-status"));
  assert.ok(panel.includes("needs_partner"));

  const spine = fs.readFileSync(
    path.join(process.cwd(), "components/dashboard/precision-health/SystemSpinePanel.tsx"),
    "utf8"
  );
  assert.ok(spine.includes("spine-partner-sandbox"));
  assert.ok(spine.includes("emis-partner-sandbox"));

  const envExample = fs.readFileSync(path.join(process.cwd(), ".env.example"), "utf8");
  assert.ok(envExample.includes("ENABLE_EMIS_PARTNER_SANDBOX"));
  assert.ok(envExample.includes("EMIS_PARTNER_CLIENT_ID"));

  const p7 = fs.readFileSync(path.join(process.cwd(), "docs/P7_PARTNER_OUTREACH_PACK.md"), "utf8");
  assert.ok(p7.includes("ENABLE_EMIS_PARTNER_SANDBOX"));

  console.log("N5 Partner sandbox honesty checks passed (liveEmis=false · flip blocked).");
}

void run();
