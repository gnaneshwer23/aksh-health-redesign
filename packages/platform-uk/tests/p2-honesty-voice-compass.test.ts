/**
 * P2 honesty: VOICE vs VOICE CARE labeling; COMPASS thin admin UX present.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { runVoiceCareEscalation } from "../lib/agents/voice-care";
import { VOICE_CARE_PRODUCT_LABEL } from "../lib/voice-care";
import { AGENT_DIRECTORY } from "../lib/agents";

const result = runVoiceCareEscalation({ caseId: "honesty-1", patientLabel: "Synthetic" });
assert.equal(result.notVoiceDictation, true);
assert.ok(result.label.includes("NOT VOICE DICTATION"));
assert.ok(VOICE_CARE_PRODUCT_LABEL.includes("not VOICE dictation"));
const directoryNames = AGENT_DIRECTORY.map((a) => String(a.name));
assert.ok(!directoryNames.includes("VOICE"));
assert.ok(!directoryNames.includes("VOICE CARE"));

const root = process.cwd();
const adminOps = readFileSync(path.join(root, "app/dashboard/admin/agent-ops/page.tsx"), "utf8");
assert.match(adminOps, /CompassBriefPanel/);
const compassPanel = readFileSync(
  path.join(root, "components/dashboard/admin/CompassBriefPanel.tsx"),
  "utf8"
);
assert.match(compassPanel, /\/api\/agents\/compass/);
assert.match(compassPanel, /POPULATION_SUPPRESSION_DISCLOSURE|small.?cell/i);
assert.match(compassPanel, /ehrWrite/);

console.log("p2-honesty-voice-compass: PASS");
