import assert from "node:assert/strict";

import { validateFastApiSynthesisResponse, requestFastApiSynthesis } from "../lib/fastapi-synthesis";
import { buildIntegrationBoundaryContract } from "../lib/integration-boundary-contract";
import { buildIntegrationEnvironmentContract } from "../lib/integration-env";
import { isFastApiSynthesisEnabled } from "../lib/integration-config";
import {
  buildTranscriptionDependencyStatus,
  getSimulatedTranscript,
  isDeepgramApiKeyConfigured,
  resolveTranscriptionMode
} from "../lib/transcription-config";

async function run() {
  assert.equal(isFastApiSynthesisEnabled(), false, "FastAPI synthesis should stay disabled in default test env");

  const valid = validateFastApiSynthesisResponse({
    fhir_draft: {
      encounter: {
        resourceType: "Encounter",
        id: "encounter-test",
        className: "primary-care",
        reason: "Test reason",
        clinicianSummary: "Summary"
      },
      condition: {
        resourceType: "Condition",
        id: "condition-test",
        codeText: "Test condition",
        clinicalStatus: "active",
        evidence: "Synthetic test evidence"
      },
      observations: []
    },
    extracted_summary: "Synthetic summary",
    safety_flags: ["medication review needed"]
  });
  assert.equal(valid.ok, true, "Valid FastAPI payload should pass validation");

  const invalid = validateFastApiSynthesisResponse({ extracted_summary: 123 });
  assert.equal(invalid.ok, false, "Invalid FastAPI payload should fail validation");

  const mockedFetch: typeof fetch = async () =>
    ({
      ok: true,
      status: 200,
      json: async () => valid.ok && valid.data
    }) as Response;

  const synthesis = await requestFastApiSynthesis({
    transcript: "Patient with cough and fever.",
    sourceType: "note",
    fetchImpl: mockedFetch
  });
  assert.equal(synthesis.ok, true, "Mocked FastAPI synthesis should validate and return data");

  const boundary = buildIntegrationBoundaryContract({ generatedBy: "Integration Boundary Test" });
  assert.equal(boundary.artifactType, "aksh-uk-eu-integration-boundary-contract");
  assert.equal(boundary.activeFlags.fastApiSynthesis, false);
  assert.equal(boundary.activeFlags.medplumSync, false);
  assert.ok(boundary.disabledByDefault.includes("medplum-sync"));
  assert.ok(boundary.disabledByDefault.includes("fastapi-synthesis"));
  assert.ok(
    boundary.rehearsalRules.some((rule) => rule.includes("must not silently replace synthetic proof behavior")),
    "Integration boundary contract should forbid silent synthetic fallback"
  );

  const envContract = buildIntegrationEnvironmentContract();
  assert.ok(
    envContract.variables.some((item) => item.name === "ENABLE_FASTAPI_SYNTHESIS" && item.defaultValue === "false"),
    "Environment contract should document FastAPI flag default"
  );
  assert.ok(
    envContract.variables.some((item) => item.name === "DEEPGRAM_API_KEY"),
    "Environment contract should document transcription dependency"
  );

  assert.equal(isDeepgramApiKeyConfigured(), false, "Deepgram should be unconfigured in default test env");
  assert.equal(await resolveTranscriptionMode(), "simulated");
  assert.ok(getSimulatedTranscript().includes("Amoxicillin"));
  assert.equal(buildTranscriptionDependencyStatus().defaultMode, "simulated");

  console.log("Integration boundary checks passed.");
}

void run();
