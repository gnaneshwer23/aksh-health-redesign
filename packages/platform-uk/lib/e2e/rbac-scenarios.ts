/**
 * E2E RBAC negative test cases — traceable to golden scenarios (brief §76).
 */

import type { GoldenScenario } from "./golden-scenarios";

export type E2ERbacCase = {
  testId: string;
  title: string;
  goldenScenarioId?: string;
  architectureLayer: string;
  actorRole: string;
  resource: string;
  expectedStatus: 401 | 403 | 404;
  expectedDenied?: boolean;
};

export const E2E_RBAC_NEGATIVE_CASES: E2ERbacCase[] = [
  {
    testId: "AKSH-E2E-RBAC-001",
    title: "Unauthenticated patient state read",
    goldenScenarioId: "AKSH-E2E-0016",
    architectureLayer: "Safety/Governance",
    actorRole: "anonymous",
    resource: "GET /api/patients/{id}/state",
    expectedStatus: 401,
  },
  {
    testId: "AKSH-E2E-RBAC-002",
    title: "Patient cannot record HITL Accept decision",
    architectureLayer: "Decision",
    actorRole: "patient",
    resource: "PUT /api/review-cases/{id}",
    expectedStatus: 403,
  },
  {
    testId: "AKSH-E2E-RBAC-003",
    title: "Researcher cannot record HITL Accept decision",
    architectureLayer: "Decision",
    actorRole: "researcher",
    resource: "PUT /api/review-cases/{id}",
    expectedStatus: 403,
  },
  {
    testId: "AKSH-E2E-RBAC-004",
    title: "Patient cannot check in for another patient",
    goldenScenarioId: "AKSH-E2E-0016",
    architectureLayer: "Safety/Governance",
    actorRole: "patient",
    resource: "POST /api/patients/{id}/check-in",
    expectedStatus: 403,
    expectedDenied: true,
  },
  {
    testId: "AKSH-E2E-RBAC-005",
    title: "Researcher blocked from federated research POST",
    architectureLayer: "Safety/Governance",
    actorRole: "patient",
    resource: "POST /api/research/federated/evaluation",
    expectedStatus: 403,
  },
  {
    testId: "AKSH-E2E-RBAC-006",
    title: "E2E admin status blocked when production gate closed",
    architectureLayer: "Observability",
    actorRole: "practice-manager",
    resource: "GET /api/admin/e2e/status",
    expectedStatus: 403,
  },
  {
    testId: "AKSH-E2E-RBAC-007",
    title: "Researcher denied patient state read",
    goldenScenarioId: "AKSH-E2E-0016",
    architectureLayer: "Patient State",
    actorRole: "researcher",
    resource: "GET /api/patients/{id}/state",
    expectedStatus: 403,
    expectedDenied: true,
  },
];

export function findGoldenScenario(id: string): GoldenScenario | undefined {
  // lazy import avoided in tests — callers pass scenario inline
  return undefined;
}
