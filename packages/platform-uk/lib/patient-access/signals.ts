/**
 * Diabetes access-gap signals. Draft findings only; nothing is written.
 *
 * Scope: monitoring gaps, missed appointments and medication/hypo concerns
 * surfaced by patient-access events. HbA1c *trend* stays with
 * lib/disease-modules/diabetes/hba1c.ts (HORIZON); this module only asks
 * "is monitoring overdue / above the review line / what did the patient report".
 *
 * Rule of the house: patient-reported data can RAISE a concern, never CLOSE one.
 *
 * TODO(CSO sign-off): every value in PATIENT_ACCESS_THRESHOLDS is a prototype
 * placeholder loosely based on NICE NG28 (HbA1c 3-6 monthly; intensify at
 * 58 mmol/mol). `hba1cUrgentMmolMol` is arbitrary. Not for non-synthetic use
 * until signed off (see PATIENT_ACCESS_HONESTY.thresholdsClinicallySignedOff).
 */
import type { AccessFinding } from "./types";
import {
  ANTICOAGULANTS,
  ANTIPLATELETS,
  CODES,
  HYPO_RISK_DRUGS,
  VERIFIED_OBSERVATION_STATUSES,
  hasCode,
  isExternal,
  refOf,
  toTime,
  type Coding,
  type FhirResource,
  type InMemoryFhirStore
} from "./fhir";

export const PATIENT_ACCESS_THRESHOLDS = {
  hba1cReviewMmolMol: 58,
  hba1cUrgentMmolMol: 75,
  hba1cIntervalDays: 183,
  annualCheckDays: 365,
  hypoWindowDays: 30,
  noShowWindowDays: 30
} as const;

export type PatientAccessThresholds = { -readonly [K in keyof typeof PATIENT_ACCESS_THRESHOLDS]: number };

const DAY = 86_400_000;

const subjectIs = (pid: string) => (r: FhirResource) =>
  (r.subject as { reference?: string } | undefined)?.reference === `Patient/${pid}`;

const observations = (store: InMemoryFhirStore, pid: string, coding: Coding) =>
  store.search("Observation", (o) => subjectIs(pid)(o) && hasCode(o, coding));

const verified = (o: FhirResource) => VERIFIED_OBSERVATION_STATUSES.has(String(o.status));

function latest(list: FhirResource[]): FhirResource | undefined {
  return [...list].sort((a, b) => toTime(String(b.effectiveDateTime)) - toTime(String(a.effectiveDateTime)))[0];
}

const value = (o: FhirResource) => (o.valueQuantity as { value: number }).value;
const day = (o: FhirResource) => String(o.effectiveDateTime).slice(0, 10);

function activeMeds(store: InMemoryFhirStore, pid: string) {
  return store.search("MedicationStatement", (m) => subjectIs(pid)(m) && m.status === "active");
}

function matching(meds: FhirResource[], drugs: string[]) {
  const hits: { drug: string; med: FhirResource }[] = [];
  for (const med of meds) {
    const text = String((med.medicationCodeableConcept as { text?: string } | undefined)?.text ?? "").toLowerCase();
    for (const drug of drugs) if (text.includes(drug)) hits.push({ drug, med });
  }
  return hits;
}

const uniq = (xs: string[]) => [...new Set(xs)].sort();

function diabetesStatus(store: InMemoryFhirStore, pid: string): "confirmed" | "reported" | null {
  let status: "reported" | null = null;
  for (const c of store.search("Condition", subjectIs(pid))) {
    const text = String((c.code as { text?: string } | undefined)?.text ?? "").toLowerCase();
    if (!hasCode(c, CODES.t2d) && !text.includes("type 2 diabetes")) continue;
    const ver = (c.verificationStatus as { coding?: Coding[] } | undefined)?.coding?.[0]?.code;
    if (ver === "confirmed") return "confirmed";
    status = "reported";
  }
  return status;
}

type Rule = (store: InMemoryFhirStore, pid: string, now: number, t: PatientAccessThresholds) => AccessFinding[];

const hba1cMonitoring: Rule = (store, pid, now, t) => {
  const all = observations(store, pid, CODES.hba1c);
  const lab = latest(all.filter(verified));
  const reported = all.filter((o) => !verified(o));
  if (lab && now - toTime(String(lab.effectiveDateTime)) <= t.hba1cIntervalDays * DAY) return [];
  let summary = "No laboratory HbA1c in the last 6 months";
  if (lab) summary += ` (last lab result ${day(lab)})`;
  if (reported.length) summary += "; a patient-reported value exists but is not counted";
  return [{
    ruleId: "hba1c-overdue", patientId: pid, severity: "moderate", summary,
    evidence: [...(lab ? [refOf(lab)] : []), ...reported.map(refOf)], action: "book_test"
  }];
};

const hba1cControl: Rule = (store, pid, _now, t) => {
  const lab = latest(observations(store, pid, CODES.hba1c).filter(verified));
  if (!lab) return [];
  const v = value(lab);
  const severity = v >= t.hba1cUrgentMmolMol ? "high" : v >= t.hba1cReviewMmolMol ? "moderate" : null;
  if (!severity) return [];
  return [{
    ruleId: "hba1c-above-threshold", patientId: pid, severity,
    summary: `Last lab HbA1c ${v} mmol/mol on ${day(lab)} is above the review threshold`,
    evidence: [refOf(lab)], action: "book_review"
  }];
};

const annualChecks: Rule = (store, pid, now, t) => {
  const overdue: string[] = [];
  const evidence: string[] = [];
  for (const [coding, label] of [[CODES.retinal, "eye screening"], [CODES.urineAcr, "urine ACR"], [CODES.foot, "foot examination"]] as const) {
    const last = latest(observations(store, pid, coding).filter(verified));
    if (last) evidence.push(refOf(last));
    if (!last || now - toTime(String(last.effectiveDateTime)) > t.annualCheckDays * DAY) overdue.push(label);
  }
  if (!overdue.length) return [];
  return [{
    ruleId: "annual-checks-overdue", patientId: pid, severity: "low",
    summary: `Annual diabetes checks overdue: ${overdue.join(", ")}`, evidence, action: "book_screening"
  }];
};

const bleedingRisk: Rule = (store, pid) => {
  const meds = activeMeds(store, pid);
  const anticoag = matching(meds, ANTICOAGULANTS);
  const antiplatelet = matching(meds, ANTIPLATELETS);
  if (!anticoag.length || !antiplatelet.length) return [];
  const involved = [...anticoag, ...antiplatelet].map((h) => h.med);
  let summary =
    `Anticoagulant (${uniq(anticoag.map((h) => h.drug)).join(", ")}) with antiplatelet ` +
    `(${uniq(antiplatelet.map((h) => h.drug)).join(", ")}): bleeding risk, confirm indication`;
  if (involved.some(isExternal)) summary += ". Medication list is patient-reported via intake and not yet reconciled";
  return [{ ruleId: "anticoagulant-antiplatelet", patientId: pid, severity: "high", summary, evidence: uniq(involved.map(refOf)), action: "book_review" }];
};

const hypoglycaemia: Rule = (store, pid, now, t) => {
  const drugs = matching(activeMeds(store, pid), HYPO_RISK_DRUGS);
  if (!drugs.length) return [];
  const recent = observations(store, pid, CODES.hypoCount).filter(
    (o) => now - toTime(String(o.effectiveDateTime)) <= t.hypoWindowDays * DAY
  );
  const last = latest(recent);
  const count = Number(last?.valueInteger ?? 0);
  if (!last || count < 1) return [];
  return [{
    ruleId: "hypoglycaemia-on-hypo-risk-drug", patientId: pid, severity: "high",
    summary: `${count} self-reported hypo episode(s) in 30 days while on ${uniq(drugs.map((d) => d.drug)).join(", ")}`,
    evidence: [refOf(last), ...drugs.map((d) => refOf(d.med))], action: "book_review"
  }];
};

const missedAppointment: Rule = (store, pid, now, t) => {
  const pref = `Patient/${pid}`;
  const missed = store.search(
    "Appointment",
    (a) =>
      a.status === "noshow" &&
      ((a.participant as { actor?: { reference?: string } }[] | undefined) ?? []).some((p) => p.actor?.reference === pref) &&
      now - toTime(String(a.start)) <= t.noShowWindowDays * DAY
  );
  if (!missed.length) return [];
  const lab = latest(observations(store, pid, CODES.hba1c).filter(verified));
  const high = Boolean(lab && value(lab) >= t.hba1cUrgentMmolMol);
  return [{
    ruleId: "missed-appointment", patientId: pid, severity: high ? "high" : "moderate",
    summary: `Missed appointment on ${String(missed[0].start).slice(0, 10)}${high ? " with last HbA1c above the urgent threshold" : ""}`,
    evidence: missed.map(refOf), action: "rebook_missed"
  }];
};

const RULES: Rule[] = [hba1cMonitoring, hba1cControl, annualChecks, bleedingRisk, hypoglycaemia, missedAppointment];

export function evaluatePatientAccessSignals(
  store: InMemoryFhirStore,
  patientId: string,
  now: Date,
  overrides: Partial<PatientAccessThresholds> = {}
): AccessFinding[] {
  const t: PatientAccessThresholds = { ...PATIENT_ACCESS_THRESHOLDS, ...overrides };
  const status = diabetesStatus(store, patientId);
  if (!status) return []; // outside the diabetes cohort
  const findings: AccessFinding[] = [];
  if (status === "reported") {
    findings.push({
      ruleId: "diagnosis-unconfirmed", patientId, severity: "low",
      summary: "Type 2 diabetes is patient-reported only; confirm against GP record", evidence: [], action: null
    });
  }
  for (const rule of RULES) findings.push(...rule(store, patientId, now.getTime(), t));
  return findings;
}
