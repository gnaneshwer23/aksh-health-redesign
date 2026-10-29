/**
 * Assemble Phase 3 medication + personalised care snapshots and HITL flows.
 */

import { randomUUID } from "crypto";

import { getPatientById } from "../mock-data";
import {
  createMedRecon,
  decideMedRecon,
  listAllergies,
  listCareAssignments,
  listMedRecons,
} from "../patient-intelligence/repository";
import type { MedicationListItem, MedReconDiscrepancy } from "../patient-intelligence/types";
import {
  createHandoff,
  createPersonalisedCarePlan,
  createSafetyReview,
  createTask,
  decidePersonalisedCarePlan,
  decideSafetyReview,
  listApprovalHistory,
  listCarePlans,
  listGoals,
  listHandoffs,
  listSafetyFlags,
  listSafetyReviews,
  listTasks,
  replacePatientMedCareSeed,
  updateTaskStatus,
  upsertGoal,
} from "./medcare-repository";
import {
  CARE_PLAN_TEMPLATES,
  EDUCATIONAL_CATALOG,
  INTERACTION_SOURCE_HONESTY,
  buildSyntheticInteractions,
  defaultGoalsForPatient,
  safetyFlagsFromInteractions,
} from "./medcare-seed";
import type {
  CarePlanTemplateId,
  CareTaskStatus,
  MedCareDecisionAction,
  MedCareReviewSection,
  MedicationPersonalisedCareSnapshot,
  PersonalisedCarePlanSection,
  PatientGoalStatus,
} from "./medcare-types";
import type { MissingDataIndicator } from "./types";

function patientLabel(patientId: string): string {
  return getPatientById(patientId)?.name?.trim() || patientId;
}

function medicationItemsFromCohort(patientId: string): MedicationListItem[] {
  const patient = getPatientById(patientId);
  return (patient?.activeMedications ?? []).map((name) => ({
    name,
    status: /proposed/i.test(name) ? ("proposed" as const) : ("active" as const),
    source: "mock_cohort",
  }));
}

function assessMissing(input: {
  medications: MedicationListItem[];
  allergiesCount: number;
  pendingFlags: number;
  goalsCount: number;
}): MissingDataIndicator[] {
  const missing: MissingDataIndicator[] = [];
  if (input.medications.length === 0) {
    missing.push({
      code: "medications_empty",
      message: "No medications on cohort / recon list",
      field: "medications",
    });
  }
  if (input.allergiesCount === 0) {
    missing.push({
      code: "allergies_unconfirmed",
      message: "No structured allergies on Patient 360 spine — confirm NKDA vs missing",
      field: "allergies",
    });
  }
  if (input.goalsCount === 0) {
    missing.push({
      code: "goals_none",
      message: "No patient goals recorded yet",
      field: "goals",
    });
  }
  if (input.pendingFlags > 0) {
    missing.push({
      code: "safety_flags_pending",
      message: `${input.pendingFlags} medication safety flag(s) awaiting clinician review`,
      field: "safetyFlags",
    });
  }
  return missing;
}

export async function buildMedicationPersonalisedCare(
  patientId: string,
  options?: { scopeKey?: string }
): Promise<MedicationPersonalisedCareSnapshot> {
  const scopeKey = options?.scopeKey ?? "shared";
  const label = patientLabel(patientId);
  const medications = medicationItemsFromCohort(patientId);

  const [allergies, medRecons, safetyFlags, safetyReviews, carePlans, goals, tasks, handoffs, history, careTeam] =
    await Promise.all([
      listAllergies(patientId, { scopeKey }),
      listMedRecons(patientId, { scopeKey }),
      listSafetyFlags(patientId, { scopeKey }),
      listSafetyReviews(patientId, { scopeKey }),
      listCarePlans(patientId, { scopeKey }),
      listGoals(patientId, { scopeKey }),
      listTasks(patientId, { scopeKey }),
      listHandoffs(patientId, { scopeKey }),
      listApprovalHistory(patientId, { scopeKey }),
      listCareAssignments(patientId, { scopeKey }),
    ]);

  const interactions = buildSyntheticInteractions(
    patientId,
    medications.map((m) => m.name)
  );

  const missingData = assessMissing({
    medications,
    allergiesCount: allergies.length,
    pendingFlags: safetyFlags.filter((f) => f.status === "pending_review").length,
    goalsCount: goals.length,
  });

  return {
    patientId,
    patientLabel: label,
    synthetic: true,
    ehrWrite: false,
    hitlRequired: true,
    autonomousPrescribe: false,
    autonomousAdjust: false,
    clinicalValidationClaim: false,
    validatedCds: false,
    medications,
    medicationReconciliations: medRecons,
    allergyInteractions: {
      allergies,
      interactions,
      source: INTERACTION_SOURCE_HONESTY,
    },
    safetyFlags,
    safetyReviews,
    carePlanTemplates: CARE_PLAN_TEMPLATES,
    carePlans,
    goals,
    educationalResources: EDUCATIONAL_CATALOG,
    assignedTasks: tasks,
    handoffs,
    approvalHistory: history,
    missingData,
    note:
      careTeam.length === 0
        ? "Phase 3 medication + personalised care — synthetic stub interactions (not a licensed drug DB); ehrWrite=false; no autonomous prescribe/adjust; not clinically validated."
        : `Phase 3 medication + personalised care — ${careTeam.filter((c) => c.status === "active").length} care-team assignment(s) on Patient 360 spine. Synthetic stub interactions; ehrWrite=false.`,
  };
}

export async function seedAndBuildMedicationPersonalisedCare(
  patientId: string,
  options?: { scopeKey?: string; actor?: string; now?: number }
): Promise<MedicationPersonalisedCareSnapshot> {
  const scopeKey = options?.scopeKey ?? "shared";
  const actor = options?.actor ?? "synthetic-seed";
  const now = options?.now ?? Date.now();
  const medications = medicationItemsFromCohort(patientId);
  const allergies = await listAllergies(patientId, { scopeKey });
  const interactions = buildSyntheticInteractions(
    patientId,
    medications.map((m) => m.name)
  );
  const safetyFlags = safetyFlagsFromInteractions(
    patientId,
    interactions,
    allergies.map((a) => ({ substance: a.substance, criticality: a.criticality })),
    now
  );
  const goals = defaultGoalsForPatient(patientId, now);
  const due = new Date(now + 7 * 86400_000).toISOString();
  const taskId = `task-${patientId}-med-recon`;
  const tasks = [
    {
      id: taskId,
      patientId,
      title: "Complete medication reconciliation",
      description:
        "Run Patient 360 med recon scaffolding and review synthetic safety flags — no prescribe.",
      ownerRole: "gp",
      ownerDisplay: "Named GP",
      status: "open" as const,
      dueAt: due,
      relatedPlanId: null,
      relatedFlagId: safetyFlags[0]?.id ?? null,
      createdAt: new Date(now).toISOString(),
      updatedAt: new Date(now).toISOString(),
      closedAt: null,
      note: null,
      synthetic: true as const,
      ehrWrite: false as const,
    },
  ];
  const handoffs = [
    {
      id: `hand-${patientId}-seed`,
      patientId,
      fromRole: "gp",
      toRole: "clinical-pharmacist",
      toMemberDisplay: "Practice pharmacist (synthetic)",
      summary:
        "Handoff for medicines review of synthetic interaction flags — decision support only.",
      relatedTaskId: taskId,
      createdAt: new Date(now).toISOString(),
      acknowledgedAt: null,
      synthetic: true as const,
      ehrWrite: false as const,
    },
  ];

  await replacePatientMedCareSeed(
    patientId,
    { safetyFlags, goals, tasks, handoffs },
    { scopeKey, actor }
  );

  // Ensure a pending med recon exists when cohort has meds (extends Phase 1 workflow).
  const existing = await listMedRecons(patientId, { scopeKey });
  if (!existing.some((r) => r.status === "pending_clinician" || r.status === "in_progress")) {
    const discrepancies: MedReconDiscrepancy[] = medications
      .filter((m) => m.status === "proposed")
      .map((m) => ({
        code: "proposed_medication",
        message: `${m.name} is proposed — clinician reconciliation required before any prescribe`,
        medication: m.name,
      }));
    await createMedRecon(
      {
        patientId,
        sourceList: medications,
        reconciledList: medications.filter((m) => m.status !== "proposed"),
        discrepancies:
          discrepancies.length > 0
            ? discrepancies
            : medications.length === 0
              ? [{ code: "empty_medication_list", message: "No medications to reconcile" }]
              : [
                  {
                    code: "confirm_active_list",
                    message: "Confirm active list with patient — Phase 3 extends recon workflow",
                  },
                ],
        createdBy: actor,
        note: "Phase 3 seed — scaffolding only; does not prescribe or write EHR",
      },
      { scopeKey }
    );
  }

  return buildMedicationPersonalisedCare(patientId, { scopeKey });
}

export async function startMedCareReconciliation(
  patientId: string,
  options: { scopeKey?: string; createdBy: string }
): Promise<MedicationPersonalisedCareSnapshot> {
  const scopeKey = options.scopeKey ?? "shared";
  const medications = medicationItemsFromCohort(patientId);
  const discrepancies: MedReconDiscrepancy[] = medications
    .filter((m) => m.status === "proposed")
    .map((m) => ({
      code: "proposed_medication",
      message: `${m.name} is proposed — clinician reconciliation required before any prescribe`,
      medication: m.name,
    }));
  if (medications.length === 0) {
    discrepancies.push({
      code: "empty_medication_list",
      message: "No medications on cohort record to reconcile",
    });
  }
  await createMedRecon(
    {
      patientId,
      sourceList: medications,
      reconciledList: medications.filter((m) => m.status !== "proposed"),
      discrepancies,
      createdBy: options.createdBy,
      note: "Phase 3 recon — does not prescribe or write to EHR",
    },
    { scopeKey }
  );
  return buildMedicationPersonalisedCare(patientId, { scopeKey });
}

export async function decideMedCareReconciliation(
  input: {
    patientId: string;
    runId: string;
    action: "complete" | "cancel";
    actor: string;
    note?: string;
  },
  options?: { scopeKey?: string }
): Promise<MedicationPersonalisedCareSnapshot> {
  const scopeKey = options?.scopeKey ?? "shared";
  await decideMedRecon(
    {
      runId: input.runId,
      action: input.action,
      actor: input.actor,
      note: input.note,
    },
    { scopeKey }
  );
  return buildMedicationPersonalisedCare(input.patientId, { scopeKey });
}

export async function draftMedicationSafetyReview(
  patientId: string,
  options: { scopeKey?: string; createdBy: string }
): Promise<MedicationPersonalisedCareSnapshot> {
  const scopeKey = options.scopeKey ?? "shared";
  const snap = await buildMedicationPersonalisedCare(patientId, { scopeKey });
  const pending = snap.safetyFlags.filter((f) => f.status === "pending_review");
  const sections: MedCareReviewSection[] = [
    {
      id: "interactions",
      title: "Allergy & interaction panel (synthetic stub)",
      clinical: true,
      items: [
        snap.allergyInteractions.source.label,
        snap.allergyInteractions.source.note,
        ...snap.allergyInteractions.interactions
          .slice(0, 5)
          .map((i) => `${i.severity.toUpperCase()}: ${i.drugA} + ${i.drugB} — ${i.recommendation}`),
        ...snap.allergyInteractions.allergies
          .slice(0, 3)
          .map((a) => `Allergy: ${a.substance} (${a.criticality})`),
      ],
    },
    {
      id: "flags",
      title: "Medication safety flags for clinician review",
      clinical: true,
      items:
        pending.length > 0
          ? pending.map((f) => `${f.severity}: ${f.title}`)
          : ["No pending flags — absence of flags is not clinical clearance"],
    },
    {
      id: "honesty",
      title: "Safety & honesty",
      clinical: true,
      items: [
        "ehrWrite remains false",
        "No autonomous prescribe or dose adjustment",
        "validatedCds=false — not unvalidated CDS performance claims",
        "Interaction source is synthetic stub, not a licensed drug database",
      ],
    },
  ];

  await createSafetyReview(
    {
      patientId,
      patientLabel: snap.patientLabel,
      summarySections: sections,
      flagIds: pending.map((f) => f.id),
      createdBy: options.createdBy,
    },
    { scopeKey }
  );

  return buildMedicationPersonalisedCare(patientId, { scopeKey });
}

export async function decideMedicationSafetyReview(
  input: {
    patientId: string;
    reviewId: string;
    action: MedCareDecisionAction;
    actor: string;
    reason?: string;
    editedSections?: MedCareReviewSection[];
  },
  options?: { scopeKey?: string }
): Promise<MedicationPersonalisedCareSnapshot> {
  await decideSafetyReview(input, options);
  return buildMedicationPersonalisedCare(input.patientId, {
    scopeKey: options?.scopeKey,
  });
}

export async function applyCarePlanTemplate(
  patientId: string,
  templateId: CarePlanTemplateId,
  options: { scopeKey?: string; createdBy: string }
): Promise<MedicationPersonalisedCareSnapshot> {
  const scopeKey = options.scopeKey ?? "shared";
  const template = CARE_PLAN_TEMPLATES.find((t) => t.id === templateId);
  if (!template) {
    const err = new Error(`Unknown template ${templateId}`) as Error & { status: number };
    err.status = 400;
    throw err;
  }
  const snap = await buildMedicationPersonalisedCare(patientId, { scopeKey });
  const medSummary =
    snap.medications.length > 0
      ? `Current list (${snap.medications.length}): ${snap.medications
          .slice(0, 4)
          .map((m) => m.name)
          .join("; ")}`
      : "No medications on list — confirm with patient";
  const sections: PersonalisedCarePlanSection[] = template.sections.map((s) => ({
    id: s.id,
    title: s.title,
    clinical: s.clinical,
    items: [
      ...s.itemTemplates,
      ...(s.id === "medicines" || s.id === "recon" ? [medSummary] : []),
      ...(s.id === "interactions"
        ? [
            `${snap.allergyInteractions.interactions.length} synthetic interaction flag(s)`,
            INTERACTION_SOURCE_HONESTY.label,
          ]
        : []),
    ],
  }));

  const goalsLinked = snap.goals.slice(0, 2).map((g) => g.id);
  const educationLinked = EDUCATIONAL_CATALOG.filter((e) => e.audience === "patient")
    .slice(0, 2)
    .map((e) => e.id);

  const plan = await createPersonalisedCarePlan(
    {
      patientId,
      patientLabel: snap.patientLabel,
      templateId,
      title: `${template.title} — ${snap.patientLabel}`,
      sections,
      goalsLinked,
      educationLinked,
      createdBy: options.createdBy,
    },
    { scopeKey }
  );

  await createTask(
    {
      patientId,
      title: `Follow through: ${template.title}`,
      description: `Assigned after drafting personalised plan ${plan.id} — complete only after HITL Accept.`,
      ownerRole: "gp",
      ownerDisplay: "Named GP",
      status: "open",
      dueAt: new Date(Date.now() + 10 * 86400_000).toISOString(),
      relatedPlanId: plan.id,
      relatedFlagId: null,
      note: null,
    },
    { scopeKey, actor: options.createdBy }
  );

  return buildMedicationPersonalisedCare(patientId, { scopeKey });
}

export async function decideMedCarePlan(
  input: {
    patientId: string;
    planId: string;
    action: MedCareDecisionAction;
    actor: string;
    reason?: string;
    editedSections?: PersonalisedCarePlanSection[];
  },
  options?: { scopeKey?: string }
): Promise<MedicationPersonalisedCareSnapshot> {
  await decidePersonalisedCarePlan(input, options);
  return buildMedicationPersonalisedCare(input.patientId, {
    scopeKey: options?.scopeKey,
  });
}

export async function setPatientGoalStatus(
  input: {
    patientId: string;
    goalId: string;
    status: PatientGoalStatus;
    actor: string;
  },
  options?: { scopeKey?: string }
): Promise<MedicationPersonalisedCareSnapshot> {
  const scopeKey = options?.scopeKey ?? "shared";
  const goals = await listGoals(input.patientId, { scopeKey });
  const goal = goals.find((g) => g.id === input.goalId);
  if (!goal) {
    const err = new Error("Goal not found") as Error & { status: number };
    err.status = 404;
    throw err;
  }
  await upsertGoal(
    { ...goal, status: input.status, updatedAt: new Date().toISOString() },
    { scopeKey }
  );
  return buildMedicationPersonalisedCare(input.patientId, { scopeKey });
}

export async function advanceMedCareTask(
  input: {
    patientId: string;
    taskId: string;
    status: CareTaskStatus;
    note?: string;
    actor: string;
  },
  options?: { scopeKey?: string }
): Promise<MedicationPersonalisedCareSnapshot> {
  await updateTaskStatus(input, options);
  return buildMedicationPersonalisedCare(input.patientId, {
    scopeKey: options?.scopeKey,
  });
}

export async function handoffMedCareTask(
  input: {
    patientId: string;
    taskId: string;
    fromRole: string;
    toRole: string;
    toMemberDisplay?: string;
    summary: string;
    actor: string;
  },
  options?: { scopeKey?: string }
): Promise<MedicationPersonalisedCareSnapshot> {
  const scopeKey = options?.scopeKey ?? "shared";
  await createHandoff(
    {
      patientId: input.patientId,
      fromRole: input.fromRole,
      toRole: input.toRole,
      toMemberDisplay: input.toMemberDisplay ?? null,
      summary: input.summary,
      relatedTaskId: input.taskId,
      actor: input.actor,
    },
    { scopeKey }
  );
  return buildMedicationPersonalisedCare(input.patientId, { scopeKey });
}

/** Test helper — unique goal id when needed. */
export function newGoalId(patientId: string): string {
  return `goal-${patientId}-${randomUUID().slice(0, 8)}`;
}
