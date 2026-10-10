import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { evaluatePatientChatAccess } from "../lib/chat/patient-access";
import { loadPatientChatContext } from "../lib/chat/patient-context";
import {
  CLINICIAN_SUGGESTED_PROMPTS,
  PATIENT_SUGGESTED_PROMPTS,
  buildPatientChatSystemPrompt,
} from "../lib/chat/patient-prompt";
import { GET as getPatientChat, POST as postPatientChat } from "../app/api/chat/patient/route";

/**
 * P1 — Ask Aksh patient drawer / POST /api/chat/patient
 * Focused RBAC + context + route contract tests.
 */

const TEST_USER = "ask_aksh_p1_test_user";

function buildRequest(
  method: "GET" | "POST",
  options: {
    role: string;
    patientId?: string;
    audience?: string;
    boundPatientId?: string;
    body?: Record<string, unknown>;
    query?: Record<string, string>;
  }
) {
  const headers: Record<string, string> = {
    "x-user-id": TEST_USER,
    "x-user-email": "ask-aksh-p1@akshhealth.com",
    "x-user-role": options.role,
  };
  if (options.boundPatientId) {
    headers["x-bound-patient-id"] = options.boundPatientId;
  }
  if (method === "POST") {
    headers["content-type"] = "application/json";
  }

  const url = new URL("http://localhost:3000/api/chat/patient");
  if (options.query) {
    for (const [k, v] of Object.entries(options.query)) url.searchParams.set(k, v);
  }

  return new Request(url.toString(), {
    method,
    headers,
    body: method === "POST" ? JSON.stringify(options.body ?? {}) : undefined,
  });
}

async function run() {
  process.env.AKSH_TEST_AUTH_HEADER = "true";
  const previousGateway = process.env.AI_GATEWAY_API_KEY;
  const previousVercel = process.env.VERCEL;
  // Force "configured" so POST reaches auth/RBAC rather than 503.
  process.env.AI_GATEWAY_API_KEY = process.env.AI_GATEWAY_API_KEY || "test-key-not-used";

  try {
    // --- Pure access matrix ---
    assert.equal(
      evaluatePatientChatAccess({
        appRole: "clinical_reviewer",
        requestedPatientId: "P002",
      }).allowed,
      true,
      "GP/nurse/pharmacist (clinical_reviewer) may chat about named patients"
    );

    assert.equal(
      evaluatePatientChatAccess({
        appRole: "operations_lead",
        requestedPatientId: "P002",
      }).allowed,
      false,
      "regional / admin / hospital executive (operations_lead) denied named PHI chat"
    );

    assert.equal(
      evaluatePatientChatAccess({
        appRole: "researcher",
        requestedPatientId: "P002",
      }).allowed,
      false,
      "Researcher denied named PHI chat"
    );

    assert.equal(
      evaluatePatientChatAccess({
        appRole: "patient",
        boundPatientId: "P002",
        requestedPatientId: "P002",
        audience: "patient",
      }).allowed,
      true,
      "Patient self-scope allowed"
    );

    assert.equal(
      evaluatePatientChatAccess({
        appRole: "patient",
        boundPatientId: "P002",
        requestedPatientId: "P001",
        audience: "patient",
      }).allowed,
      false,
      "Patient cannot chat about another patient"
    );

    assert.equal(
      evaluatePatientChatAccess({
        appRole: "patient",
        boundPatientId: null,
        requestedPatientId: "P002",
        audience: "patient",
      }).allowed,
      false,
      "Patient without bound id fails closed"
    );

    assert.equal(
      evaluatePatientChatAccess({
        appRole: "patient",
        boundPatientId: "P002",
        requestedPatientId: "P002",
        audience: "clinician",
      }).allowed,
      false,
      "Patient role cannot use clinician audience"
    );

    // --- Chart context for P002 ---
    const ctx = await loadPatientChatContext("P002");
    assert.ok(ctx, "P002 context loads");
    assert.equal(ctx!.patientId, "P002");
    assert.equal(ctx!.liveEmis, false);
    assert.ok(ctx!.medications.length > 0, "P002 has medications");
    assert.ok(ctx!.conditions.some((c) => /diabetes/i.test(c)), "P002 has diabetes condition");
    assert.ok(ctx!.openQueue.length > 0, "P002 has open queue items");
    assert.ok(ctx!.diabetes.hba1c.length > 0, "P002 has HbA1c fixture");

    const system = buildPatientChatSystemPrompt({ audience: "clinician", context: ctx! });
    assert.match(system, /not a diagnosis/i);
    assert.match(system, /liveEmis/);
    assert.match(system, /HITL|Accept/i);
    assert.ok(CLINICIAN_SUGGESTED_PROMPTS.length >= 4);
    assert.ok(PATIENT_SUGGESTED_PROMPTS.length >= 3);

    // --- Route RBAC ---
    const unauth = await getPatientChat(
      new Request("http://localhost:3000/api/chat/patient?patientId=P002")
    );
    // Without test auth / session → 401
    assert.equal(unauth.status, 401, "Unauthenticated GET denied");

    const gpGet = await getPatientChat(
      buildRequest("GET", {
        role: "gp",
        query: { patientId: "P002", audience: "clinician" },
      })
    );
    assert.equal(gpGet.status, 200);
    const gpBody = (await gpGet.json()) as {
      access?: { allowed?: boolean };
      liveEmis?: boolean;
      hitlRequired?: boolean;
      suggestedPrompts?: string[];
    };
    assert.equal(gpBody.access?.allowed, true);
    assert.equal(gpBody.liveEmis, false);
    assert.equal(gpBody.hitlRequired, true);
    assert.ok((gpBody.suggestedPrompts?.length ?? 0) > 0);

    const icsGet = await getPatientChat(
      buildRequest("GET", {
        role: "ics-lead",
        query: { patientId: "P002" },
      })
    );
    assert.equal(icsGet.status, 200);
    const icsBody = (await icsGet.json()) as { access?: { allowed?: boolean } };
    assert.equal(icsBody.access?.allowed, false, "regional GET reports access denied");

    const researcherPost = await postPatientChat(
      buildRequest("POST", {
        role: "researcher",
        body: {
          patientId: "P002",
          audience: "clinician",
          messages: [
            {
              id: "m1",
              role: "user",
              parts: [{ type: "text", text: "Summarise risks" }],
            },
          ],
        },
      })
    );
    assert.equal(researcherPost.status, 403, "Researcher POST denied");

    const adminPost = await postPatientChat(
      buildRequest("POST", {
        role: "practice-manager",
        body: {
          patientId: "P002",
          messages: [
            {
              id: "m1",
              role: "user",
              parts: [{ type: "text", text: "Summarise risks" }],
            },
          ],
        },
      })
    );
    assert.equal(adminPost.status, 403, "Admin default off for named PHI chat");

    const missingPatient = await postPatientChat(
      buildRequest("POST", {
        role: "gp",
        body: {
          messages: [
            {
              id: "m1",
              role: "user",
              parts: [{ type: "text", text: "Hello" }],
            },
          ],
        },
      })
    );
    assert.equal(missingPatient.status, 400, "patientId required");

    const crossPatient = await postPatientChat(
      buildRequest("POST", {
        role: "patient",
        boundPatientId: "P002",
        body: {
          patientId: "P001",
          audience: "patient",
          messages: [
            {
              id: "m1",
              role: "user",
              parts: [{ type: "text", text: "Hello" }],
            },
          ],
        },
      })
    );
    assert.equal(crossPatient.status, 403, "Cross-patient chat denied");

    // --- UI mount contracts ---
    const root = process.cwd();
    const gpPage = readFileSync(path.join(root, "app/dashboard/gp/page.tsx"), "utf8");
    assert.match(gpPage, /AskAkshDrawer/);
    assert.match(gpPage, /gp-ask-aksh-trigger/);

    const nurseLayout = readFileSync(path.join(root, "app/dashboard/nurse/layout.tsx"), "utf8");
    assert.match(nurseLayout, /AskAkshDrawer/);

    const pharmLayout = readFileSync(
      path.join(root, "app/dashboard/pharmacist/layout.tsx"),
      "utf8"
    );
    assert.match(pharmLayout, /AskAkshDrawer/);

    const companion = readFileSync(
      path.join(root, "components/dashboard/PatientCompanion.tsx"),
      "utf8"
    );
    assert.match(companion, /AskAkshPanel/);
    assert.match(companion, /audience="patient"/);
    assert.doesNotMatch(companion, /MOCK_RESPONSES/);

    const panel = readFileSync(path.join(root, "components/chat/AskAkshPanel.tsx"), "utf8");
    assert.match(panel, /assisted review · not a diagnosis/i);
    assert.match(panel, /Select a patient first/i);

    console.log("Ask Aksh patient chat P1 tests passed.");
  } finally {
    if (previousGateway === undefined) delete process.env.AI_GATEWAY_API_KEY;
    else process.env.AI_GATEWAY_API_KEY = previousGateway;
    if (previousVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = previousVercel;
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
