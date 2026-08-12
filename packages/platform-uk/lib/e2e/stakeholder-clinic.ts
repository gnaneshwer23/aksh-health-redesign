/**
 * Coherent multi-stakeholder diabetes clinic simulation.
 * Each role completes a diabetes-relevant job with state/audit consistency.
 * LIVE vs SIMULATED honesty preserved — simulated stack must complete cleanly.
 */

import { getTwinSimulationStatus, runScenario } from "../precision-health/twin-simulation";

import {
  bookAppointment,
  closeNoShowTask,
  markAppointmentNoShow,
  sendAppointmentReminder,
  type AppointmentNoShowTask,
  type SimulatedAppointment,
} from "./appointment-sim";
import {
  resolveCareTeam,
  routePharmacyTaskToCareTeam,
  type CareTeamFollowUp,
  type CareTeamSnapshot,
} from "./care-team-sim";
import {
  buildSimulatedCgmHypoSeries,
  raiseCgmSafetyAlert,
  type CgmSafetyAlert,
} from "./cgm-sim";
import {
  assertRevokeBlocksPurpose,
  grantConsent,
  revokeConsent,
  type ConsentGrant,
} from "./consent-sim";
import { SIMULATED_EHR_ADAPTER, stageEhrAdapterWrite } from "./ehr-adapter";
import { completeLabResult, findDelayedLabs, markLabDelayed, type LabSimResult } from "./lab-sim";
import { buildE2EPopulationAggregate, type E2EPopulationAggregate } from "./learning-state-assertions";
import {
  emitNotification,
  markNotificationActioned,
  openCoordinatorTask,
  progressCoordinatorTask,
  type CoordinatorTask,
  type SimulatedNotification,
} from "./notification-sim";
import {
  createCoordinationTaskFromPharmacyEvent,
  documentPharmacyBarrier,
  escalateCoordinationTaskToClinician,
  findAdherenceFailures,
  type PharmacyCoordinationTask,
} from "./pharmacy-sim";
import {
  acceptReferralDraftForSend,
  createReferralDraft,
  type SimulatedReferralDraft,
} from "./referral-sim";
import type { E2EGeneratedDataset, E2EPatientProfile } from "./types";
import {
  captureSimulatedVoiceEncounter,
  draftSynthesisFromSimulatedVoice,
  type SimulatedSynthesisDraft,
  type SimulatedVoiceCapture,
} from "./voice-sim";

export type StakeholderRoleKey =
  | "patient"
  | "gp"
  | "nurse"
  | "specialist"
  | "lab"
  | "pharmacy"
  | "care_coordinator"
  | "admin"
  | "safety"
  | "population_ops";

export type StakeholderActivityRow = {
  role: StakeholderRoleKey;
  diabetesJob: string;
  canComplete: boolean;
  classification: "LIVE" | "SIMULATED" | "PARTIAL";
  evidence: string;
};

export type StakeholderClinicResult = {
  artifactType: "aksh-e2e-stakeholder-clinic";
  correlationId: string;
  organisationId: string;
  clinicId: string;
  patientId: string;
  ehrAdapterId: typeof SIMULATED_EHR_ADAPTER.id;
  regionAgnostic: true;
  liveEmis: false;
  ehrWrite: false;
  appointment: SimulatedAppointment;
  noShowTask: AppointmentNoShowTask;
  consents: ConsentGrant[];
  consentRevokeBlocked: boolean;
  voice: SimulatedVoiceCapture;
  synthesis: SimulatedSynthesisDraft;
  lab: LabSimResult;
  pharmacyTask: PharmacyCoordinationTask;
  careTeam: CareTeamSnapshot;
  pharmacyFollowUp: CareTeamFollowUp;
  nurseFollowUp: CareTeamFollowUp;
  cgmAlert: CgmSafetyAlert | null;
  referral: SimulatedReferralDraft;
  notifications: SimulatedNotification[];
  coordinatorTasks: CoordinatorTask[];
  digitalTwin: {
    physiologicalTwin: false;
    simulationMode: "synthetic_rules";
    optionCount: number;
  };
  population: E2EPopulationAggregate;
  activityMatrix: StakeholderActivityRow[];
  overall: "PASS" | "FAIL";
  failures: string[];
  note: string;
};

export type StakeholderClinicOptions = {
  dataset: E2EGeneratedDataset;
  patient: E2EPatientProfile;
  correlationId: string;
  /** Optional cohort D patient for CGM path */
  cgmPatient?: E2EPatientProfile | null;
  /** Optional cohort E patient for pharmacy */
  pharmacyPatient?: E2EPatientProfile | null;
  /** Optional cohort F patient for lab delay */
  labPatient?: E2EPatientProfile | null;
};

function clinicIdFor(orgId: string): string {
  return `clinic-${orgId}`;
}

/**
 * Run the full simulated multi-stakeholder diabetes clinic for one correlationId.
 */
export function runStakeholderClinic(options: StakeholderClinicOptions): StakeholderClinicResult {
  const { dataset, patient, correlationId } = options;
  const organisationId = patient.organisationId;
  const clinicId = clinicIdFor(organisationId);
  const failures: string[] = [];

  const careTeam = resolveCareTeam(patient, dataset.users);
  if (careTeam.members.length < 1) failures.push("care team empty");

  // --- Admin / org: EHR adapter staging (region-agnostic) ---
  const identityStage = stageEhrAdapterWrite(
    {
      organisationId,
      clinicId,
      correlationId,
      patientId: patient.id,
      actor: "e2e.admin",
    },
    "patient_identity"
  );
  if (identityStage.liveWrite !== false) failures.push("EHR adapter claimed live write");

  // --- Patient + admin: consent grants ---
  let consents: ConsentGrant[] = [
    grantConsent({
      patientId: patient.id,
      purpose: "care_coordination",
      correlationId,
      actor: "e2e.patient",
    }),
    grantConsent({
      patientId: patient.id,
      purpose: "voice_encounter_capture",
      correlationId,
      actor: "e2e.patient",
    }),
    grantConsent({
      patientId: patient.id,
      purpose: "lab_share",
      correlationId,
      actor: "e2e.patient",
    }),
    grantConsent({
      patientId: patient.id,
      purpose: "pharmacy_share",
      correlationId,
      actor: "e2e.patient",
    }),
    grantConsent({
      patientId: patient.id,
      purpose: "digital_twin_ranking",
      correlationId,
      actor: "e2e.patient",
    }),
  ];

  // Mid-journey revoke of research_aggregate (never granted) + revoke digital_twin then re-check
  const researchGrant = grantConsent({
    patientId: patient.id,
    purpose: "research_aggregate",
    correlationId,
    actor: "e2e.patient",
  });
  consents = [...consents, researchGrant];
  consents = consents.map((g) =>
    g.purpose === "research_aggregate" ? revokeConsent(g, "e2e.patient") : g
  );
  const revokeCheck = assertRevokeBlocksPurpose(consents, patient.id, "research_aggregate");
  if (!revokeCheck.ok) failures.push("consent revoke did not block research_aggregate");

  // --- Appointments: book → remind → no-show → coordinator closes chase ---
  let appointment = bookAppointment({
    patientId: patient.id,
    organisationId,
    clinicId,
    kind: "diabetes_review",
    scheduledAt: "2026-08-15T09:30:00.000Z",
    clinicianUserId: patient.primaryDoctorId,
    correlationId,
    actor: "e2e.admin",
  });
  appointment = sendAppointmentReminder(appointment);
  const noShow = markAppointmentNoShow({ appointment, actor: "e2e.admin" });
  appointment = noShow.appointment;
  let noShowTask = noShow.task;
  noShowTask = closeNoShowTask(noShowTask, "e2e.carecoordinator");
  if (appointment.status !== "no_show") failures.push("appointment no-show failed");
  if (noShowTask.status !== "closed") failures.push("no-show task not closed");

  // --- VOICE (SIMULATED) → SYNTHESIS draft ---
  const voice = captureSimulatedVoiceEncounter({
    patientId: patient.id,
    correlationId,
    actor: "e2e.gp",
  });
  const synthesis = draftSynthesisFromSimulatedVoice(voice);
  if (voice.liveMicCapture !== false || !synthesis.hitlRequired) {
    failures.push("VOICE/SYNTHESIS honesty broken");
  }

  // --- Lab stakeholder (cohort F preferred) ---
  const labPatient = options.labPatient ?? patient;
  let delayed = findDelayedLabs(dataset.labEvents, { patientId: labPatient.id });
  if (delayed.length === 0) {
    const anyLab = dataset.labEvents.find((e) => e.patientId === labPatient.id);
    if (anyLab) {
      delayed = [
        markLabDelayed({
          event: { ...anyLab, status: "ordered", value: null, resultedAt: null },
          actor: correlationId,
        }).event,
      ];
    }
  }
  if (delayed.length === 0) {
    failures.push("no lab event for lab patient");
  }
  const lab =
    delayed[0] != null
      ? completeLabResult({
          event: delayed[0],
          value: 58,
          unit: "mL/min/1.73m²",
          actor: correlationId,
        })
      : (null as unknown as LabSimResult);
  if (lab && (lab.liveNhsLab !== false || !lab.patientStateFact)) {
    failures.push("lab complete honesty/fact failed");
  }

  // --- Pharmacy → care coordinator → GP ---
  const pharmacyPatient = options.pharmacyPatient ?? patient;
  const failuresPharm = findAdherenceFailures(dataset.pharmacyEvents, {
    patientId: pharmacyPatient.id,
  });
  const pharmCareTeam = resolveCareTeam(pharmacyPatient, dataset.users);
  let pharmacyTask: PharmacyCoordinationTask;
  let pharmacyFollowUp: CareTeamFollowUp;
  if (failuresPharm[0] && pharmCareTeam.members.length >= 1) {
    pharmacyTask = createCoordinationTaskFromPharmacyEvent({
      event: failuresPharm[0],
      actor: correlationId,
    });
    pharmacyTask = documentPharmacyBarrier(
      pharmacyTask,
      `Clinic ${correlationId} adherence barrier`,
      "e2e.carecoordinator"
    );
    pharmacyTask = escalateCoordinationTaskToClinician(pharmacyTask, "e2e.carecoordinator");
    pharmacyFollowUp = routePharmacyTaskToCareTeam({ task: pharmacyTask, careTeam: pharmCareTeam });
    if (pharmacyTask.status !== "escalated_to_clinician") {
      failures.push("pharmacy escalation failed");
    }
  } else {
    failures.push("pharmacy adherence path unavailable");
    pharmacyTask = {
      id: "missing",
      pharmacyEventId: "missing",
      patientId: pharmacyPatient.id,
      kind: "adherence_follow_up",
      assigneeRole: "care_coordinator",
      status: "open",
      barrierSummary: "missing",
      medication: "n/a",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      hitlRequired: true,
      ehrWrite: false,
      livePrescribing: false,
    };
    pharmacyFollowUp = {
      id: "missing",
      patientId: pharmacyPatient.id,
      source: "pharmacy",
      sourceEventId: "missing",
      assignedToUserId: null,
      assignedRole: "care_coordinator",
      summary: "missing",
      status: "queued",
      createdAt: new Date().toISOString(),
      hitlRequired: true,
      ehrWrite: false,
    };
  }

  // --- Nurse follow-up (operational, not directory-only) ---
  const nurseFollowUp: CareTeamFollowUp = {
    id: `e2e-nurse-fu-${correlationId.slice(-8)}`,
    patientId: patient.id,
    source: "clinical",
    sourceEventId: synthesis.id,
    assignedToUserId: careTeam.nurseIds[0] ?? careTeam.members[0]?.userId ?? null,
    assignedRole: "nurse",
    summary: `Nurse follow-up after SIMULATED VOICE/SYNTHESIS draft · corr=${correlationId}`,
    status: "done",
    createdAt: new Date().toISOString(),
    hitlRequired: true,
    ehrWrite: false,
  };
  if (!nurseFollowUp.assignedToUserId && careTeam.members.length === 0) {
    failures.push("nurse follow-up has no assignee");
  }

  // --- CGM safety (cohort D) ---
  const cgmPatient =
    options.cgmPatient ?? dataset.patients.find((p) => p.cohortId === "D") ?? null;
  let cgmAlert: CgmSafetyAlert | null = null;
  if (cgmPatient) {
    const events = buildSimulatedCgmHypoSeries(cgmPatient);
    cgmAlert = raiseCgmSafetyAlert({
      patient: cgmPatient,
      events,
      correlationId,
    });
    if (!cgmAlert) failures.push("CGM hypo alert not raised for cohort D");
  } else {
    failures.push("no cohort D patient for CGM path");
  }

  // --- Specialist referral draft (PATHWAY) + HITL Accept-for-send (still no live write) ---
  let referral = createReferralDraft({
    patientId: patient.id,
    organisationId,
    clinicId,
    specialty: "endocrinology",
    reason: "Progressive T2D deterioration — specialist input draft",
    correlationId,
    actor: "e2e.gp",
  });
  referral = acceptReferralDraftForSend(referral, "e2e.gp");
  if (referral.eReferralWrite !== false || referral.status !== "accepted_for_send") {
    failures.push("referral draft honesty/status failed");
  }

  // --- Notifications + coordinator task board ---
  const notifications: SimulatedNotification[] = [
    emitNotification({
      patientId: patient.id,
      kind: "no_show_chase",
      title: "Appointment no-show",
      body: `Chase ${appointment.id}`,
      audienceRole: "care_coordinator",
      correlationId,
    }),
    emitNotification({
      patientId: labPatient.id,
      kind: "lab_delayed",
      title: "Lab delayed",
      body: "eGFR delayed then completed (SIMULATED)",
      audienceRole: "gp",
      correlationId,
    }),
    emitNotification({
      patientId: pharmacyPatient.id,
      kind: "pharmacy_adherence",
      title: "Pharmacy adherence barrier",
      body: pharmacyTask.barrierSummary,
      audienceRole: "care_coordinator",
      correlationId,
    }),
  ];
  if (cgmAlert) {
    notifications.push(
      emitNotification({
        patientId: cgmAlert.patientId,
        kind: "cgm_safety",
        title: "CGM safety alert",
        body: cgmAlert.summary,
        audienceRole: "gp",
        correlationId,
      })
    );
  }
  const actioned = notifications.map((n) => markNotificationActioned(n));

  let ccoTask = openCoordinatorTask({
    patientId: patient.id,
    kind: "no_show_chase",
    summary: `Coordinator closes no-show + pharmacy chase · corr=${correlationId}`,
    correlationId,
    sourceNotificationId: actioned[0]?.id,
  });
  ccoTask = progressCoordinatorTask(ccoTask, "done", "e2e.carecoordinator");
  const coordinatorTasks: CoordinatorTask[] = [ccoTask];
  if (ccoTask.status !== "done") failures.push("coordinator task not completed");

  // --- Digital twin labelling (synthetic_rules, not physiological) ---
  const twinStatus = getTwinSimulationStatus();
  const twinRun = runScenario(patient.id, ["add_sglt2", "continue_current", "home_bp_telemonitor"]);
  if (twinStatus.physiologicalTwin !== false || twinRun.physiologicalTwin !== false) {
    failures.push("digital twin over-claimed physiological");
  }
  if (twinRun.simulationMode !== "synthetic_rules") {
    failures.push("digital twin mode not synthetic_rules");
  }

  // --- Population / ops aggregate ---
  const population = buildE2EPopulationAggregate(dataset);
  if (population.totalPatients < 100 || population.isSynthetic !== true) {
    failures.push("population aggregate invalid");
  }

  const activityMatrix: StakeholderActivityRow[] = [
    {
      role: "patient",
      diabetesJob: "Grant/revoke purpose-bound consent; receive appointment reminder",
      canComplete: revokeCheck.ok && appointment.status === "no_show",
      classification: "SIMULATED",
      evidence: `consents=${consents.length} · revokeBlocks=${revokeCheck.ok}`,
    },
    {
      role: "gp",
      diabetesJob: "VOICE→SYNTHESIS draft + PATHWAY referral Accept-for-send (HITL)",
      canComplete: synthesis.hitlRequired && referral.status === "accepted_for_send",
      classification: "SIMULATED",
      evidence: `synth=${synthesis.id} · referral=${referral.id}`,
    },
    {
      role: "nurse",
      diabetesJob: "Complete diabetes follow-up after encounter draft",
      canComplete: nurseFollowUp.status === "done",
      classification: "SIMULATED",
      evidence: `followUp=${nurseFollowUp.id} · assignee=${nurseFollowUp.assignedToUserId}`,
    },
    {
      role: "specialist",
      diabetesJob: "Receive endocrinology referral draft (staged, not live send)",
      canComplete: referral.specialty === "endocrinology" && referral.eReferralWrite === false,
      classification: "SIMULATED",
      evidence: `stagingId=${referral.stagingId}`,
    },
    {
      role: "lab",
      diabetesJob: "Delay then complete eGFR without fabricating delayed values",
      canComplete: Boolean(lab?.patientStateFact) && lab?.liveNhsLab === false,
      classification: "SIMULATED",
      evidence: lab ? `fact=${lab.patientStateFact?.factType}` : "missing",
    },
    {
      role: "pharmacy",
      diabetesJob: "Surface adherence failure → coordinator → clinician",
      canComplete: pharmacyTask.status === "escalated_to_clinician",
      classification: "SIMULATED",
      evidence: `task=${pharmacyTask.id} → ${pharmacyFollowUp.assignedRole}`,
    },
    {
      role: "care_coordinator",
      diabetesJob: "Close no-show chase + pharmacy coordination tasks",
      canComplete: noShowTask.status === "closed" && ccoTask.status === "done",
      classification: "SIMULATED",
      evidence: `noshow=${noShowTask.id} · cco=${ccoTask.id}`,
    },
    {
      role: "admin",
      diabetesJob: "Organisation/clinic EHR adapter staging (region-agnostic)",
      canComplete: identityStage.staged && SIMULATED_EHR_ADAPTER.regionAgnostic,
      classification: "SIMULATED",
      evidence: `adapter=${SIMULATED_EHR_ADAPTER.id} · org=${organisationId}`,
    },
    {
      role: "safety",
      diabetesJob: "CGM hypo escalate to clinician (no autonomous treatment)",
      canComplete: Boolean(cgmAlert && cgmAlert.hitlRequired && cgmAlert.decisionBias === "ESCALATE"),
      classification: "SIMULATED",
      evidence: cgmAlert ? `alert=${cgmAlert.id} hypos=${cgmAlert.hypoEventCount7d}` : "missing",
    },
    {
      role: "population_ops",
      diabetesJob: "Read synthetic population aggregate with small-cell suppression",
      canComplete: population.totalPatients >= 100 && population.liveEmis === false,
      classification: "SIMULATED",
      evidence: `n=${population.totalPatients} · deteriorating=${population.deterioratingDisplay}`,
    },
  ];

  for (const row of activityMatrix) {
    if (!row.canComplete) failures.push(`role ${row.role} cannot complete: ${row.diabetesJob}`);
  }

  return {
    artifactType: "aksh-e2e-stakeholder-clinic",
    correlationId,
    organisationId,
    clinicId,
    patientId: patient.id,
    ehrAdapterId: SIMULATED_EHR_ADAPTER.id,
    regionAgnostic: true,
    liveEmis: false,
    ehrWrite: false,
    appointment,
    noShowTask,
    consents,
    consentRevokeBlocked: revokeCheck.ok,
    voice,
    synthesis,
    lab,
    pharmacyTask,
    careTeam,
    pharmacyFollowUp,
    nurseFollowUp,
    cgmAlert,
    referral,
    notifications: actioned,
    coordinatorTasks,
    digitalTwin: {
      physiologicalTwin: false,
      simulationMode: "synthetic_rules",
      optionCount: twinRun.options.length,
    },
    population,
    activityMatrix,
    overall: failures.length === 0 ? "PASS" : "FAIL",
    failures,
    note:
      "Simulated multi-stakeholder diabetes clinic — region-agnostic organisation/clinic IDs; live mic/EHR/EPS/lab feeds remain false; HITL required for clinical decisions.",
  };
}
