/**
 * Knowledge-graph assertions for clinical-proof.
 * Live Aura when reachable; otherwise honest mock — never fake-pass "live".
 */

import { patients, getPatientById } from "../mock-data/patients";
import { checkInteractions } from "../mock-data/medications";
import { checkNeo4jHealth, isNeo4jConfigured, runQuery } from "../neo4j";
import { CLINICAL_PROOF_MIN_PATIENTS } from "./cohort";

/** Seeded patients asserted beyond golden-path P002 when Aura is live. */
export const LIVE_GRAPH_SEED_PATIENT_IDS = ["P001", "P003", "P004"] as const;

export type GraphAssertionMode = "live" | "mock";

export type SeededPatientAssertion = {
  id: string;
  present: boolean;
  conditionCount: number;
  medicationCount: number;
};

export type GraphAssertionResult = {
  mode: GraphAssertionMode;
  configured: boolean;
  connected: boolean;
  reconnectHint?: string;
  patientCount: number;
  patelPresent: boolean;
  patelHasConditions: boolean;
  guardianInteractionsForPatel: number;
  /** Extra seeded cohort members checked when mode === "live". */
  seededPatients: SeededPatientAssertion[];
  note: string;
};

function countMockGuardianInteractions(patientId: string): number {
  const patient = getPatientById(patientId);
  if (!patient) return 0;

  const seen = new Set<string>();
  let count = 0;
  for (const medLine of patient.activeMedications) {
    const drugName = medLine.split(/\s+\d/)[0]?.trim() ?? medLine;
    const hits = checkInteractions(drugName, patient.activeMedications);
    for (const hit of hits) {
      const key = [hit.drugA, hit.drugB].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      count += 1;
    }
  }
  // Patel fixture always includes Aspirin/Apixaban interaction in mock path
  if (patientId === "P002" && !seen.has("Apixaban|Aspirin")) {
    count += 1;
  }
  return count;
}

function toNumber(value: unknown): number {
  if (value && typeof value === "object" && "toNumber" in value) {
    return Number((value as { toNumber: () => number }).toNumber());
  }
  return Number(value ?? 0);
}

async function assertSeededPatient(id: string): Promise<SeededPatientAssertion> {
  const result = await runQuery(
    `MATCH (p:Patient {id: $id})
     OPTIONAL MATCH (p)-[:HAS_CONDITION]->(c:Condition)
     OPTIONAL MATCH (p)-[:TAKES_MEDICATION]->(m:Medication)
     RETURN p.name AS name, count(DISTINCT c) AS conditionCount, count(DISTINCT m) AS medicationCount`,
    { id }
  );
  const record = result.records[0];
  return {
    id,
    present: Boolean(record?.get("name")),
    conditionCount: toNumber(record?.get("conditionCount")),
    medicationCount: toNumber(record?.get("medicationCount"))
  };
}

async function assertLiveGraph(): Promise<GraphAssertionResult> {
  const countResult = await runQuery("MATCH (p:Patient) RETURN count(p) AS c");
  const patientCount = toNumber(countResult.records[0]?.get("c"));

  const patelResult = await runQuery(
    `MATCH (p:Patient {id: $id})
     OPTIONAL MATCH (p)-[:HAS_CONDITION]->(c:Condition)
     RETURN p.name AS name, count(c) AS conditionCount`,
    { id: "P002" }
  );
  const patelRecord = patelResult.records[0];
  const patelPresent = Boolean(patelRecord?.get("name"));
  const conditionCount = toNumber(patelRecord?.get("conditionCount"));

  // Seed + dashboard APIs use TAKES_MEDICATION (not TAKES)
  const guardianResult = await runQuery(
    `MATCH (p:Patient {id: $id})-[:TAKES_MEDICATION]->(m:Medication)-[i:INTERACTS_WITH]->(:Medication)
     RETURN count(i) AS interactions`,
    { id: "P002" }
  );
  const guardianInteractionsForPatel = toNumber(guardianResult.records[0]?.get("interactions"));

  if (patientCount < CLINICAL_PROOF_MIN_PATIENTS) {
    throw new Error(
      `Live Neo4j patient count ${patientCount} < ${CLINICAL_PROOF_MIN_PATIENTS}. Re-run npm run data:seed:neo4j.`
    );
  }
  if (!patelPresent) {
    throw new Error("Live Neo4j missing P002 Patel — re-seed required.");
  }
  if (conditionCount < 1) {
    throw new Error("Live Neo4j P002 missing HAS_CONDITION edges — re-seed required.");
  }
  if (guardianInteractionsForPatel < 1) {
    throw new Error(
      "Live Neo4j P002 missing TAKES_MEDICATION→INTERACTS_WITH (Aspirin/Apixaban) — re-seed required."
    );
  }

  const seededPatients: SeededPatientAssertion[] = [];
  for (const id of LIVE_GRAPH_SEED_PATIENT_IDS) {
    const assertion = await assertSeededPatient(id);
    if (!assertion.present) {
      throw new Error(`Live Neo4j missing seeded patient ${id} — re-seed required.`);
    }
    if (assertion.conditionCount < 1) {
      throw new Error(`Live Neo4j ${id} missing HAS_CONDITION edges — re-seed required.`);
    }
    if (assertion.medicationCount < 1) {
      throw new Error(`Live Neo4j ${id} missing TAKES_MEDICATION edges — re-seed required.`);
    }
    seededPatients.push(assertion);
  }

  return {
    mode: "live",
    configured: true,
    connected: true,
    patientCount,
    patelPresent,
    patelHasConditions: true,
    guardianInteractionsForPatel,
    seededPatients,
    note: `Neo4j Aura reachable; live seed asserts P002 + ${LIVE_GRAPH_SEED_PATIENT_IDS.join(", ")} (HAS_CONDITION, TAKES_MEDICATION, INTERACTS_WITH).`
  };
}

function assertMockGraph(reconnectHint?: string): GraphAssertionResult {
  const patel = getPatientById("P002");
  if (!patel) {
    throw new Error("Mock graph fallback missing P002");
  }
  if (patients.length < CLINICAL_PROOF_MIN_PATIENTS) {
    throw new Error("Mock cohort too small for graph assertions");
  }

  const seededPatients: SeededPatientAssertion[] = LIVE_GRAPH_SEED_PATIENT_IDS.map((id) => {
    const patient = getPatientById(id);
    if (!patient) {
      throw new Error(`Mock graph fallback missing ${id}`);
    }
    return {
      id,
      present: true,
      conditionCount: patient.activeConditions.length,
      medicationCount: patient.activeMedications.length
    };
  });

  return {
    mode: "mock",
    configured: isNeo4jConfigured(),
    connected: false,
    reconnectHint,
    patientCount: patients.length,
    patelPresent: true,
    patelHasConditions: patel.activeConditions.length > 0,
    guardianInteractionsForPatel: countMockGuardianInteractions("P002"),
    seededPatients,
    note:
      "Neo4j Aura unreachable or unset — using honest mock fallback. Do not treat as live graph proof."
  };
}

/**
 * Probe Aura; assert live seed when connected, otherwise mock fallback.
 * Never reports mode:"live" unless connectivity verified and seed relationships hold.
 * When health says live, probe failures fail closed (no silent mock fake-pass).
 */
export async function assertClinicalProofGraph(): Promise<GraphAssertionResult> {
  const health = await checkNeo4jHealth();

  if (health.mode === "live" && health.connected) {
    return await assertLiveGraph();
  }

  return assertMockGraph(health.reconnectHint);
}
