/**
 * INT-09 — connected diabetes patient-scoped APIs must deny cross-patient
 * and ops/researcher access via denyUnlessConnectedPatientAccess
 * (evaluateAppRoleClinicalReadAccess → evaluatePatientUrlAccess).
 *
 * Run: npx tsx tests/connected-patient-api-access.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { GET as getAgentIntelligence } from "../app/api/patients/[id]/agent-intelligence/route";
import { POST as postAgentDraftDecision } from "../app/api/patients/[id]/agent-intelligence/draft/[draftId]/decision/route";
import { GET as getContinuousCare } from "../app/api/patients/[id]/continuous-care/route";
import { POST as postEscalationDecision } from "../app/api/patients/[id]/continuous-care/escalation/[escalationId]/decision/route";
import { GET as getDiabetesIntelligence } from "../app/api/patients/[id]/diabetes-intelligence/route";
import { POST as postGlucoseReviewDecision } from "../app/api/patients/[id]/diabetes-intelligence/review/[reviewId]/decision/route";
import { GET as getDiabetesJourney } from "../app/api/patients/[id]/diabetes-journey/route";
import { POST as postJourneyCarePlanDecision } from "../app/api/patients/[id]/diabetes-journey/care-plan/[planId]/decision/route";
import { POST as postFollowUp } from "../app/api/patients/[id]/diabetes-journey/follow-up/[taskId]/route";
import { GET as getMedicationCare } from "../app/api/patients/[id]/medication-care/route";
import { POST as postMedCarePlanDecision } from "../app/api/patients/[id]/medication-care/care-plan/[planId]/decision/route";
import { POST as postMedReconDecision } from "../app/api/patients/[id]/medication-care/medication-reconciliation/[runId]/decision/route";
import { POST as postSafetyReviewDecision } from "../app/api/patients/[id]/medication-care/safety-review/[reviewId]/decision/route";
import { GET as getPatient360 } from "../app/api/patients/[id]/patient-360/route";
import { GET as getPatient360Fhir } from "../app/api/patients/[id]/patient-360/fhir/route";
import { POST as postP360MedReconDecision } from "../app/api/patients/[id]/patient-360/medication-reconciliation/[runId]/decision/route";
import { GET as getTimeline } from "../app/api/patients/[id]/timeline/route";
import { GET as getConnectedDiabetes } from "../app/api/patients/[id]/connected-diabetes/route";
import { denyUnlessConnectedPatientAccess } from "../lib/clinical-proof/connected-patient-access";
import { evaluateAppRoleClinicalReadAccess } from "../lib/clinical-proof/tenant-isolation";

const TEST_SCOPE = "int09_access_test_user";
const BOUND = "P002";
const OTHER = "P003";

const CONNECTED_ROUTE_FILES = [
  "app/api/patients/[id]/diabetes-journey/route.ts",
  "app/api/patients/[id]/diabetes-journey/care-plan/[planId]/decision/route.ts",
  "app/api/patients/[id]/diabetes-journey/follow-up/[taskId]/route.ts",
  "app/api/patients/[id]/patient-360/route.ts",
  "app/api/patients/[id]/patient-360/fhir/route.ts",
  "app/api/patients/[id]/patient-360/medication-reconciliation/[runId]/decision/route.ts",
  "app/api/patients/[id]/diabetes-intelligence/route.ts",
  "app/api/patients/[id]/diabetes-intelligence/review/[reviewId]/decision/route.ts",
  "app/api/patients/[id]/medication-care/route.ts",
  "app/api/patients/[id]/medication-care/care-plan/[planId]/decision/route.ts",
  "app/api/patients/[id]/medication-care/safety-review/[reviewId]/decision/route.ts",
  "app/api/patients/[id]/medication-care/medication-reconciliation/[runId]/decision/route.ts",
  "app/api/patients/[id]/continuous-care/route.ts",
  "app/api/patients/[id]/continuous-care/escalation/[escalationId]/decision/route.ts",
  "app/api/patients/[id]/agent-intelligence/route.ts",
  "app/api/patients/[id]/agent-intelligence/draft/[draftId]/decision/route.ts",
  "app/api/patients/[id]/timeline/route.ts",
  "app/api/patients/[id]/connected-diabetes/route.ts",
];

function authHeaders(role: string, extra: Record<string, string> = {}) {
  return {
    "x-user-id": TEST_SCOPE,
    "x-user-email": "int09@akshhealth.com",
    "x-user-role": role,
    "content-type": "application/json",
    ...extra,
  };
}

function patientBoundHeaders() {
  return authHeaders("patient", { "x-bound-patient-id": BOUND });
}

/**
 * Loose params typing: App Router handlers declare specific param shapes
 * (`{ id }`, `{ id; planId }`, …). A single harness type must accept all of
 * them under contravariant checking — `Promise<any>` is intentional here.
 */
type Handler = (
  request: Request,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- heterogeneous route params
  context: { params: Promise<any> }
) => Promise<Response>;

async function callGet(handler: Handler, patientId: string, headers: Record<string, string>) {
  return handler(new Request(`http://localhost/api/patients/${patientId}/probe`, { headers }), {
    params: Promise.resolve({ id: patientId }),
  });
}

async function callPost(
  handler: Handler,
  patientId: string,
  headers: Record<string, string>,
  params: Record<string, string>,
  body: Record<string, unknown> = { action: "accept" }
) {
  return handler(
    new Request(`http://localhost/api/patients/${patientId}/probe`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: patientId, ...params }) }
  );
}

async function run() {
  const previousDatabaseUrl = process.env.DATABASE_URL;
  const previousUsePostgres = process.env.USE_POSTGRES;
  delete process.env.DATABASE_URL;
  delete process.env.USE_POSTGRES;
  process.env.AKSH_TEST_AUTH_HEADER = "true";

  try {
    // --- Policy helper (unit) ---
    assert.equal(
      evaluateAppRoleClinicalReadAccess({
        appRole: "patient",
        boundPatientId: BOUND,
        requestedPatientId: OTHER,
      }).allowed,
      false
    );
    assert.equal(
      denyUnlessConnectedPatientAccess(
        { userRole: "patient", boundPatientId: BOUND },
        OTHER
      )?.status,
      403
    );
    assert.equal(
      denyUnlessConnectedPatientAccess(
        { userRole: "patient", boundPatientId: null },
        BOUND
      )?.status,
      403
    );
    assert.equal(
      denyUnlessConnectedPatientAccess(
        { userRole: "researcher", boundPatientId: null },
        BOUND
      )?.status,
      403
    );
    assert.equal(
      denyUnlessConnectedPatientAccess(
        { userRole: "operations_lead", boundPatientId: null },
        BOUND
      )?.status,
      403
    );
    assert.equal(
      denyUnlessConnectedPatientAccess(
        { userRole: "clinical_reviewer", boundPatientId: null },
        BOUND
      ),
      null
    );
    assert.equal(
      denyUnlessConnectedPatientAccess(
        { userRole: "patient", boundPatientId: BOUND },
        BOUND
      ),
      null
    );

    // --- Static wiring: every connected route imports the gate ---
    for (const rel of CONNECTED_ROUTE_FILES) {
      const src = fs.readFileSync(path.join(process.cwd(), rel), "utf8");
      assert.ok(
        src.includes("denyUnlessConnectedPatientAccess"),
        `${rel} must call denyUnlessConnectedPatientAccess (INT-09)`
      );
    }

    // --- GET isolation across modules ---
    const getCases: Array<{ name: string; handler: Handler }> = [
      { name: "diabetes-journey", handler: getDiabetesJourney },
      { name: "patient-360", handler: getPatient360 },
      { name: "patient-360/fhir", handler: getPatient360Fhir },
      { name: "diabetes-intelligence", handler: getDiabetesIntelligence },
      { name: "medication-care", handler: getMedicationCare },
      { name: "continuous-care", handler: getContinuousCare },
      { name: "agent-intelligence", handler: getAgentIntelligence },
      { name: "timeline", handler: getTimeline },
      { name: "connected-diabetes", handler: getConnectedDiabetes },
    ];

    for (const { name, handler } of getCases) {
      const cross = await callGet(handler, OTHER, patientBoundHeaders());
      assert.equal(cross.status, 403, `${name} GET: cross-patient must 403`);
      const body = (await cross.json()) as { denied?: boolean };
      assert.equal(body.denied, true, `${name} GET: denied flag`);

      const unbound = await callGet(handler, BOUND, authHeaders("patient"));
      assert.equal(unbound.status, 403, `${name} GET: unbound patient must 403`);

      const researcher = await callGet(handler, BOUND, authHeaders("researcher"));
      assert.equal(researcher.status, 403, `${name} GET: researcher must 403`);

      const gp = await callGet(handler, BOUND, authHeaders("gp"));
      assert.equal(gp.status, 200, `${name} GET: gp must be allowed`);
    }

    // Bound patient may read own record
    const own = await callGet(getPatient360, BOUND, patientBoundHeaders());
    assert.equal(own.status, 200, "patient GET own patient-360 must 200");

    // --- POST decision routes: cross-patient denied before domain logic ---
    const postCases: Array<{
      name: string;
      handler: Handler;
      params: Record<string, string>;
      body?: Record<string, unknown>;
    }> = [
      {
        name: "journey care-plan decision",
        handler: postJourneyCarePlanDecision,
        params: { planId: "plan-x" },
      },
      {
        name: "journey follow-up",
        handler: postFollowUp,
        params: { taskId: "task-x" },
        body: { action: "acknowledge" },
      },
      {
        name: "glucose review decision",
        handler: postGlucoseReviewDecision,
        params: { reviewId: "rev-x" },
      },
      {
        name: "medcare care-plan decision",
        handler: postMedCarePlanDecision,
        params: { planId: "plan-x" },
      },
      {
        name: "medcare safety-review decision",
        handler: postSafetyReviewDecision,
        params: { reviewId: "rev-x" },
      },
      {
        name: "medcare recon decision",
        handler: postMedReconDecision,
        params: { runId: "run-x" },
        body: { action: "complete" },
      },
      {
        name: "p360 recon decision",
        handler: postP360MedReconDecision,
        params: { runId: "run-x" },
        body: { action: "complete" },
      },
      {
        name: "escalation decision",
        handler: postEscalationDecision,
        params: { escalationId: "esc-x" },
      },
      {
        name: "agent draft decision",
        handler: postAgentDraftDecision,
        params: { draftId: "draft-x" },
      },
    ];

    for (const { name, handler, params, body } of postCases) {
      const cross = await callPost(handler, OTHER, patientBoundHeaders(), params, body);
      assert.equal(cross.status, 403, `${name} POST: cross-patient must 403`);
      const payload = (await cross.json()) as { denied?: boolean };
      assert.equal(payload.denied, true, `${name} POST: denied flag`);
    }

    console.log(
      `INT-09 connected patient API access: ${getCases.length} GETs + ${postCases.length} POSTs isolated; ${CONNECTED_ROUTE_FILES.length} routes wired.`
    );
  } finally {
    delete process.env.AKSH_TEST_AUTH_HEADER;
    if (previousDatabaseUrl) process.env.DATABASE_URL = previousDatabaseUrl;
    else delete process.env.DATABASE_URL;
    if (previousUsePostgres) process.env.USE_POSTGRES = previousUsePostgres;
    else delete process.env.USE_POSTGRES;
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
