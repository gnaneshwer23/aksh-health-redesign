/**
 * D1 demo launch — BRIDGE FHIR-in-Neon/file staging, export handoff, honesty.
 * Invariants: liveEmis:false · HITL required · Medplum not required · no certified flip.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { unlink } from "node:fs/promises";

import {
  getBridgeStagingStatus,
  resolveAcceptStagingBundle,
  stageAcceptedCaseToBridge
} from "../lib/bridge-staging";
import {
  getBridgeStagingHonesty,
  listBridgeStagingBundles,
  persistBridgeStagingBundle
} from "../lib/repositories/bridge-staging-repository";
import { canFlipLiveEmisInCode, SPINE_PARTNER_HONESTY } from "../lib/clinical-spine/partner-readiness";

const scopeKey = `d1_${Date.now()}`;
const dataDir = path.join(process.cwd(), "data");
const stagingFile = path.join(dataDir, `bridge-staging-bundles.${scopeKey}.json`);

async function run() {
  assert.equal(SPINE_PARTNER_HONESTY.liveEmis, false);
  assert.equal(canFlipLiveEmisInCode(), false);

  const honesty = getBridgeStagingHonesty();
  assert.equal(honesty.liveEmis, false);
  assert.equal(honesty.medplumRequired, false);
  assert.equal(honesty.syntheticOnly, true);
  assert.ok(honesty.note.includes("liveEmis:false"));

  const resolved = resolveAcceptStagingBundle({
    caseId: "case-d1-proof",
    acceptedBy: "d1@aksh.health"
  });
  assert.ok(resolved.resourceCount > 0);
  assert.equal(resolved.bundle.liveEmis, false);
  assert.equal(resolved.bundle.bridgeStatus, "preliminary");

  const persisted = await persistBridgeStagingBundle({
    caseId: "case-d1-proof",
    scopeKey,
    acceptedBy: "d1@aksh.health",
    status: "preliminary",
    bundleSummary: resolved.summary,
    bundle: resolved.bundle
  });
  assert.equal(persisted.liveEmis, false);
  assert.equal(persisted.medplumRequired, false);
  assert.equal(persisted.status, "preliminary");
  assert.ok(persisted.id.startsWith("bridge-stage-"));

  const listed = await listBridgeStagingBundles({ scopeKey, caseId: "case-d1-proof", limit: 5 });
  assert.ok(listed.length >= 1);
  assert.equal(listed[0].liveEmis, false);

  const staged = await stageAcceptedCaseToBridge({
    caseId: `case-d1-accept-${Date.now()}`,
    acceptedBy: "d1-clinician@aksh.health",
    clinicianId: "d1-clinician",
    scopeKey,
    runSimWriteback: true
  });
  assert.equal(staged.liveEmis, false);
  assert.equal(staged.ehrWriteAttempted, false);
  assert.equal(staged.medplumRequired, false);
  assert.equal(staged.status, "preliminary");
  assert.ok(staged.bridgeRecord.id);
  assert.ok(staged.emisStagingEntryId);
  assert.ok(staged.simWriteId);
  assert.ok(staged.fhirResourceCount > 0);

  const status = await getBridgeStagingStatus({ scopeKey, limit: 5 });
  assert.equal(status.liveEmis, false);
  assert.equal(status.medplumRequired, false);
  assert.ok(status.paths.fhirExport.includes("export/fhir"));

  // Route / UI / docs presence
  const root = process.cwd();
  const mustExist = [
    "app/api/integrations/bridge-staging/route.ts",
    "app/api/review-cases/[id]/export/fhir/route.ts",
    "app/demo/script/page.tsx",
    "components/demo/DemoLaunchScript.tsx",
    "docs/DEMO_LAUNCH_WITHOUT_IM1.md",
    "docs/DEMO_LAUNCH_CREDENTIALS.md",
    "db/migrations/011_fhir_staging_bundles.sql"
  ];
  for (const rel of mustExist) {
    assert.ok(fs.existsSync(path.join(root, rel)), `missing ${rel}`);
  }

  const bridgeRoute = fs.readFileSync(
    path.join(root, "app/api/integrations/bridge-staging/route.ts"),
    "utf8"
  );
  assert.ok(bridgeRoute.includes("clinicianAccept"));
  assert.ok(bridgeRoute.includes("liveEmis: false") || bridgeRoute.includes("liveEmis:false"));

  const acceptRoute = fs.readFileSync(
    path.join(root, "app/api/review-cases/[id]/route.ts"),
    "utf8"
  );
  assert.ok(acceptRoute.includes("stageAcceptedCaseToBridge"));
  assert.ok(acceptRoute.includes("newlyAccepted"));

  const evidenceHeader = fs.readFileSync(
    path.join(root, "components/review/case-evidence-header.tsx"),
    "utf8"
  );
  assert.ok(evidenceHeader.includes("Download FHIR Bundle"));
  assert.ok(evidenceHeader.includes("export/fhir"));

  const demoScript = fs.readFileSync(
    path.join(root, "components/demo/DemoLaunchScript.tsx"),
    "utf8"
  );
  assert.ok(demoScript.includes("liveEmis: false"));
  assert.ok(demoScript.includes("Capture"));
  assert.ok(demoScript.includes("SHIELD"));

  const credentialsDoc = fs.readFileSync(
    path.join(root, "docs/DEMO_LAUNCH_CREDENTIALS.md"),
    "utf8"
  );
  assert.ok(credentialsDoc.includes("/signup"));
  assert.ok(credentialsDoc.includes("SMOKE_EMAIL"));
  assert.ok(!/password\s*[:=]\s*["']?(demo|password123|admin)/i.test(credentialsDoc));

  // Reject liveEmis flip language in D1 audit when present
  const auditPath = path.join(root, "docs/DEMO_LAUNCH_D1_AUDIT.md");
  if (fs.existsSync(auditPath)) {
    const audit = fs.readFileSync(auditPath, "utf8");
    assert.ok(audit.includes("liveEmis:false") || audit.includes("liveEmis: false"));
    assert.ok(!audit.includes("liveEmis:true") || audit.includes("never") || audit.includes("rejected"));
  }

  console.log("D1 demo launch tests PASS");
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await unlink(stagingFile);
    } catch {
      /* ignore */
    }
  });
