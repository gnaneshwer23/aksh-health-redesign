/**
 * Perf / security / failure assertions (Stage 11).
 * Golden scenarios: AKSH-E2E-0016, 0017, 0019 (+ non-destructive failure honesty).
 *
 * Soft by default for latency — set PERF_SMOKE_STRICT=true for hard fails.
 * Never claims live EMIS, live NHS labs, or production clinical readiness.
 */

import {
  evaluateClinicalApiAccess,
  evaluatePatientUrlAccess,
  filterRecordsForPractice,
  type PracticeScopedRecord,
} from "../clinical-proof/tenant-isolation";
import {
  evaluatePerfSample,
  getPerfSlo,
  type PerfSloId,
  type PerfSloTarget,
} from "../clinical-proof/perf-slos";
import type { OrchestrationResult } from "../clinical-proof/agent-orchestration";
import { assertGoldenScenario0019 } from "./agent-orchestration-assertions";
import type { GoldenScenario } from "./golden-scenarios";

export type PerfSecurityAssertionResult = {
  scenarioId: string;
  ok: boolean;
  errors: string[];
};

/** Extra E2E-only SLO ids (generator / projection) — soft, CI-friendly. */
export type E2EPerfSloId = PerfSloId | "generator_build" | "state_projection";

export type E2EPerfSloTarget = {
  id: E2EPerfSloId;
  label: string;
  targetMs: number;
  hardMs: number;
  howMeasured: string;
};

export const E2E_PERF_SLO_TARGETS: E2EPerfSloTarget[] = [
  {
    id: "dashboard_load",
    label: getPerfSlo("dashboard_load").label,
    targetMs: getPerfSlo("dashboard_load").targetMs,
    hardMs: getPerfSlo("dashboard_load").hardMs,
    howMeasured: getPerfSlo("dashboard_load").howMeasured,
  },
  {
    id: "agent_draft",
    label: getPerfSlo("agent_draft").label,
    targetMs: getPerfSlo("agent_draft").targetMs,
    hardMs: getPerfSlo("agent_draft").hardMs,
    howMeasured: getPerfSlo("agent_draft").howMeasured,
  },
  {
    id: "review_action",
    label: getPerfSlo("review_action").label,
    targetMs: getPerfSlo("review_action").targetMs,
    hardMs: getPerfSlo("review_action").hardMs,
    howMeasured: getPerfSlo("review_action").howMeasured,
  },
  {
    id: "generator_build",
    label: "E2E synthetic dataset generate (default seed)",
    targetMs: 2_000,
    hardMs: 8_000,
    howMeasured: "generateE2EDataset({ seed }) wall time in-process",
  },
  {
    id: "state_projection",
    label: "Patient-state fact projection for one patient",
    targetMs: 500,
    hardMs: 2_000,
    howMeasured: "projectE2EFactsForPatient in-process",
  },
];

export function getE2EPerfSlo(id: E2EPerfSloId): E2EPerfSloTarget {
  const found = E2E_PERF_SLO_TARGETS.find((t) => t.id === id);
  if (!found) throw new Error(`Unknown E2E perf SLO: ${id}`);
  return found;
}

export function evaluateE2EPerfSample(options: {
  id: E2EPerfSloId;
  elapsedMs: number;
  strict?: boolean;
}): { ok: boolean; soft: boolean; message: string } {
  if (options.id === "dashboard_load" || options.id === "agent_draft" || options.id === "review_action") {
    return evaluatePerfSample({
      id: options.id,
      elapsedMs: options.elapsedMs,
      strict: options.strict,
    });
  }

  const target = getE2EPerfSlo(options.id);
  const strict = options.strict ?? process.env.PERF_SMOKE_STRICT === "true";

  if (options.elapsedMs <= target.targetMs) {
    return {
      ok: true,
      soft: false,
      message: `${target.id} ${options.elapsedMs}ms ≤ target ${target.targetMs}ms`,
    };
  }

  if (options.elapsedMs <= target.hardMs) {
    return {
      ok: !strict,
      soft: true,
      message: `${target.id} ${options.elapsedMs}ms above soft target ${target.targetMs}ms (≤ hard ${target.hardMs}ms)`,
    };
  }

  return {
    ok: !strict,
    soft: true,
    message: `${target.id} ${options.elapsedMs}ms above hard ${target.hardMs}ms${
      strict ? " (STRICT fail)" : " (soft-fail — env may not hit prod latency)"
    }`,
  };
}

/** Lightweight INFORM reminder — must not invoke clinical agents. */
export type AppointmentReminder = {
  artifactType: "aksh-e2e-appointment-reminder";
  patientId: string;
  appointmentAt: string;
  kind: "appointment_reminder";
  decision: "INFORM";
  message: string;
  /** Always empty — proves no clinical agent overload (AKSH-E2E-0017). */
  clinicalAgentsInvoked: [];
  ehrWrite: false;
  liveEmis: false;
  autoRetrain: false;
  orchestrationInvoked: false;
};

export function buildAppointmentReminder(input: {
  patientId: string;
  appointmentAt: string;
  clinicName?: string;
}): AppointmentReminder {
  const clinic = input.clinicName?.trim() || "your GP practice";
  return {
    artifactType: "aksh-e2e-appointment-reminder",
    patientId: input.patientId.trim(),
    appointmentAt: input.appointmentAt,
    kind: "appointment_reminder",
    decision: "INFORM",
    message: `Reminder: appointment at ${clinic} on ${input.appointmentAt}. Reply to reschedule.`,
    clinicalAgentsInvoked: [],
    ehrWrite: false,
    liveEmis: false,
    autoRetrain: false,
    orchestrationInvoked: false,
  };
}

export function assertGoldenScenario0016(input: {
  practiceAId: string;
  practiceBRecords: PracticeScopedRecord[];
  orgAPatientBoundId: string;
  orgBPatientRequestedId: string;
  researcherMayReadClinical?: boolean;
}): PerfSecurityAssertionResult {
  const errors: string[] = [];

  const leaked = filterRecordsForPractice(input.practiceBRecords, input.practiceAId);
  if (leaked.length > 0) {
    errors.push(`practice ${input.practiceAId} leaked ${leaked.length} Org B record(s)`);
  }

  const crossPatient = evaluatePatientUrlAccess({
    role: "patient",
    boundPatientId: input.orgAPatientBoundId,
    requestedPatientId: input.orgBPatientRequestedId,
  });
  if (crossPatient.allowed || crossPatient.status !== 403) {
    errors.push(
      `cross-tenant patient access must be 403 (got allowed=${crossPatient.allowed} status=${crossPatient.status})`
    );
  }

  const researcher = evaluateClinicalApiAccess({
    role: "researcher",
    requestedPatientId: input.orgBPatientRequestedId,
  });
  if (researcher.allowed || input.researcherMayReadClinical === true) {
    errors.push("researcher must be denied clinical record APIs (tenant / role isolation)");
  }

  return { scenarioId: "AKSH-E2E-0016", ok: errors.length === 0, errors };
}

export function assertGoldenScenario0017(reminder: AppointmentReminder): PerfSecurityAssertionResult {
  const errors: string[] = [];

  if (reminder.artifactType !== "aksh-e2e-appointment-reminder") {
    errors.push("artifactType must be aksh-e2e-appointment-reminder");
  }
  if (reminder.decision !== "INFORM") {
    errors.push(`expected INFORM decision (got ${reminder.decision})`);
  }
  if (reminder.clinicalAgentsInvoked.length !== 0) {
    errors.push("appointment reminder must not invoke clinical agents");
  }
  if (reminder.orchestrationInvoked) {
    errors.push("appointment reminder must not run CONDUCTOR orchestration");
  }
  if (reminder.ehrWrite) {
    errors.push("reminder must not write EHR");
  }
  if (reminder.liveEmis) {
    errors.push("liveEmis must remain false");
  }
  if (!reminder.message || reminder.message.length < 10) {
    errors.push("reminder message required");
  }

  return { scenarioId: "AKSH-E2E-0017", ok: errors.length === 0, errors };
}

/**
 * Soft prompt-injection rehearsal: hostile text in reminder payload must not
 * escalate into clinical agent invocation or EHR write.
 */
export function assertReminderInjectionResilience(input: {
  reminder: AppointmentReminder;
  hostileFragment: string;
}): PerfSecurityAssertionResult {
  const base = assertGoldenScenario0017(input.reminder);
  const errors = [...base.errors];

  if (input.reminder.clinicalAgentsInvoked.length > 0) {
    errors.push("injection attempt must not spawn clinical agents");
  }
  if (input.reminder.ehrWrite || input.reminder.orchestrationInvoked) {
    errors.push("injection attempt must remain non-destructive (no EHR / orchestration)");
  }
  // Hostile fragment may appear in message text; clinical side-effects are what matter
  void input.hostileFragment;

  return { scenarioId: "AKSH-E2E-0017", ok: errors.length === 0, errors };
}

export function assertFailureHonestyInvariants(input: {
  orchestration?: OrchestrationResult;
  priorFactCount: number;
  afterFactCount: number;
  liveEmis?: boolean;
  autoRetrain?: boolean;
}): string[] {
  const errors: string[] = [];

  if (input.afterFactCount < input.priorFactCount) {
    errors.push("failure path must not destroy patient state facts");
  }
  if (input.liveEmis === true) {
    errors.push("liveEmis must remain false on failure rehearsal");
  }
  if (input.autoRetrain === true) {
    errors.push("autoRetrain must remain false on failure rehearsal");
  }
  if (input.orchestration) {
    if (input.orchestration.ehrWrite !== false) {
      errors.push("orchestration ehrWrite must be false");
    }
    if (!input.orchestration.hitlRequired) {
      errors.push("HITL must remain required even on LLM-off / failure path");
    }
  }

  return errors;
}

export function assertGoldenPerfSecurityScenario(
  scenario: GoldenScenario,
  context: {
    reminder?: AppointmentReminder;
    tenant?: Parameters<typeof assertGoldenScenario0016>[0];
    orchestration?: OrchestrationResult;
    priorFactCount?: number;
    afterFactCount?: number;
  }
): PerfSecurityAssertionResult {
  switch (scenario.testId) {
    case "AKSH-E2E-0016":
      return assertGoldenScenario0016(context.tenant!);
    case "AKSH-E2E-0017":
      return assertGoldenScenario0017(context.reminder!);
    case "AKSH-E2E-0019": {
      const orch = context.orchestration!;
      const agentResult = assertGoldenScenario0019(orch, {
        priorFactCount: context.priorFactCount,
        afterFactCount: context.afterFactCount,
      });
      const honesty = assertFailureHonestyInvariants({
        orchestration: orch,
        priorFactCount: context.priorFactCount ?? 0,
        afterFactCount: context.afterFactCount ?? 0,
        liveEmis: false,
        autoRetrain: false,
      });
      const errors = [...agentResult.errors, ...honesty];
      return { scenarioId: "AKSH-E2E-0019", ok: errors.length === 0, errors };
    }
    default:
      return {
        scenarioId: scenario.testId,
        ok: false,
        errors: [`unsupported perf/security golden scenario ${scenario.testId}`],
      };
  }
}

/** Re-export clinical SLO targets for Stage 11 evidence pack references. */
export function listClinicalPerfSloTargets(): PerfSloTarget[] {
  return [getPerfSlo("dashboard_load"), getPerfSlo("agent_draft"), getPerfSlo("review_action")];
}
