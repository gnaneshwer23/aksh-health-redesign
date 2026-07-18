/**
 * FHIR validation summary for evidence pack (deterministic fixtures).
 * Invoked by: npm run evidence:pack
 */
import { buildClinicalProofFhirR4Fixtures } from "../lib/clinical-proof/fhir-r4-fixtures";
import {
  CLINICAL_PROOF_FHIR_R4_TYPES,
  validateFhirR4Resource
} from "../lib/clinical-proof/fhir-r4-validator";

const generatedAt = new Date().toISOString();
const fixtures = buildClinicalProofFhirR4Fixtures();
const results: Array<{ resourceType: string; ok: boolean; issues: unknown[] }> = [];
let pass = 0;
let fail = 0;

for (const type of CLINICAL_PROOF_FHIR_R4_TYPES) {
  const resource = fixtures[type];
  const v = validateFhirR4Resource(resource);
  if (v.ok) pass += 1;
  else fail += 1;
  results.push({
    resourceType: type,
    ok: v.ok,
    issues: v.ok ? [] : v.issues.slice(0, 5)
  });
}

console.log(
  JSON.stringify(
    {
      artifactType: "aksh-uk-fhir-validation-summary",
      generatedAt,
      targetTypes: [...CLINICAL_PROOF_FHIR_R4_TYPES],
      resourceCount: results.length,
      pass,
      fail,
      hl7JavaValidator: "optional / not in CI",
      results
    },
    null,
    2
  )
);
