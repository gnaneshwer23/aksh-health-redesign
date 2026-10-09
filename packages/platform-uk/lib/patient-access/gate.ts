/**
 * Clinician decision gate + outreach batching for patient-access findings.
 *
 * Guarantees (each covered by tests):
 *  1. No DetectedIssue / CommunicationRequest is written before a named,
 *     authorised clinician accepts a proposal.
 *  2. Nothing is sent to the access service before acceptance.
 *  3. Outbound scripts are assembled ONLY from OUTREACH_PHRASES: logistics,
 *     never results, medicines or diagnoses.
 *  4. One outreach request per patient, however many proposals were accepted.
 *  5. Rejection requires a reason; every decision is final and audited.
 */
import type {
  AccessFinding,
  AccessProposal,
  AuditEntry,
  DispatchResult,
  OutreachRecord,
  OutreachRequest,
  OutreachType
} from "./types";
import { OUTREACH_TYPES } from "./types";
import { NHS_NUMBER_SYSTEM, refOf, type FhirResource, type InMemoryFhirStore } from "./fhir";

/** Fixed, non-clinical phrases. Array order in OUTREACH_TYPES = call priority. TODO(CSO sign-off): wording. */
export const OUTREACH_PHRASES: Record<OutreachType, string> = {
  rebook_missed: "a new date for the appointment we missed you at",
  book_review: "an appointment with your diabetes care team",
  book_test: "a routine blood test",
  book_screening: "your routine annual diabetes checks"
};

const CLOSING = " If you have questions about your health, the care team will go through them at your appointment.";

export interface AccessServiceTransport {
  requestOutreach(request: OutreachRequest): OutreachRecord;
}

/** Records requests; never calls anyone. */
export class MockAccessService implements AccessServiceTransport {
  readonly outbound: OutreachRecord[] = [];
  private seq = 0;
  requestOutreach(request: OutreachRequest): OutreachRecord {
    const record: OutreachRecord = { ...request, outreachId: `access-out-${++this.seq}`, status: "queued" };
    this.outbound.push(record);
    return record;
  }
}

export class PatientAccessGate {
  readonly proposals = new Map<string, AccessProposal>();
  readonly audit: AuditEntry[] = [];
  private seq = 0;

  constructor(
    private readonly store: InMemoryFhirStore,
    private readonly transport: AccessServiceTransport,
    private readonly authorisedClinicians: Record<string, string>,
    private readonly serviceName = "the Aksh diabetes service"
  ) {}

  log(at: Date, action: AuditEntry["action"], detail: string, proposalId?: string) {
    this.audit.push({ at: at.toISOString(), action, detail, proposalId });
  }

  propose(findings: AccessFinding[], now: Date): AccessProposal[] {
    const created: AccessProposal[] = [];
    for (const finding of findings) {
      const sameKey = [...this.proposals.values()].filter(
        (p) => p.finding.ruleId === finding.ruleId && p.finding.patientId === finding.patientId
      );
      if (sameKey.some((p) => p.finding.summary === finding.summary)) continue;
      for (const p of sameKey) {
        if (p.status === "pending") {
          p.status = "superseded";
          this.log(now, "superseded", `${p.finding.ruleId} replaced by newer information`, p.id);
        }
      }
      const proposal: AccessProposal = { id: `access-prop-${String(++this.seq).padStart(4, "0")}`, finding, status: "pending" };
      this.proposals.set(proposal.id, proposal);
      this.log(now, "proposed", `${finding.severity} ${finding.ruleId} for Patient/${finding.patientId}`, proposal.id);
      created.push(proposal);
    }
    return created;
  }

  pending(): AccessProposal[] {
    const rank = { high: 0, moderate: 1, low: 2 } as const;
    return [...this.proposals.values()]
      .filter((p) => p.status === "pending")
      .sort((a, b) => rank[a.finding.severity] - rank[b.finding.severity] || a.id.localeCompare(b.id));
  }

  accept(proposalId: string, clinicianId: string, now: Date, note = ""): AccessProposal {
    const p = this.pendingProposal(proposalId);
    const practitioner = this.practitioner(clinicianId, now);
    const f = p.finding;
    const at = now.toISOString();

    const issue = this.store.create({
      resourceType: "DetectedIssue",
      status: "final",
      severity: f.severity,
      code: { text: f.ruleId },
      patient: { reference: `Patient/${f.patientId}` },
      identifiedDateTime: at,
      author: { reference: practitioner },
      detail: note ? `${f.summary} | Clinician note: ${note}` : f.summary,
      implicated: f.evidence.map((reference) => ({ reference }))
    });
    const targets = [refOf(issue)];
    let comm: FhirResource | undefined;
    if (f.action) {
      if (!OUTREACH_TYPES.includes(f.action)) throw new Error(`Outreach type ${f.action} is not on the approved list`);
      comm = this.store.create({
        resourceType: "CommunicationRequest",
        status: "active",
        category: [{ text: f.action }],
        subject: { reference: `Patient/${f.patientId}` },
        reasonReference: [{ reference: refOf(issue) }],
        requester: { reference: practitioner },
        authoredOn: at,
        medium: [{ text: "voice" }],
        payload: [{ contentString: OUTREACH_PHRASES[f.action] }]
      });
      targets.push(refOf(comm));
    }
    this.store.create({
      resourceType: "Provenance",
      target: targets.map((reference) => ({ reference })),
      recorded: at,
      activity: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/v3-DataOperation", code: "CREATE" }] },
      agent: [
        {
          type: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/provenance-participant-type", code: "verifier" }] },
          who: { reference: practitioner }
        }
      ],
      entity: [
        { role: "derivation", what: { display: `Aksh patient-access rule ${f.ruleId}` } },
        ...f.evidence.map((reference) => ({ role: "source", what: { reference } }))
      ]
    });

    Object.assign(p, {
      status: "accepted",
      decidedBy: clinicianId,
      decidedAt: at,
      note,
      outcome: { detectedIssue: refOf(issue), ...(comm ? { communicationRequest: refOf(comm) } : {}) }
    });
    this.log(now, "accepted", `by ${clinicianId}`, p.id);
    return p;
  }

  reject(proposalId: string, clinicianId: string, now: Date, reason: string): AccessProposal {
    if (!reason.trim()) throw new Error("A rejection reason is required");
    const p = this.pendingProposal(proposalId);
    this.practitioner(clinicianId, now);
    Object.assign(p, { status: "rejected", decidedBy: clinicianId, decidedAt: now.toISOString(), note: reason });
    this.log(now, "rejected", `by ${clinicianId}: ${reason}`, p.id);
    return p;
  }

  /** One outreach request per patient covering every accepted, unsent CommunicationRequest. Idempotent. */
  dispatchOutreach(now: Date): DispatchResult[] {
    const unsent = this.store.search("CommunicationRequest", (c) => c.status === "active" && !c.identifier);
    const byPatient = new Map<string, FhirResource[]>();
    for (const c of unsent) {
      const key = (c.subject as { reference: string }).reference;
      byPatient.set(key, [...(byPatient.get(key) ?? []), c]);
    }

    const results: DispatchResult[] = [];
    for (const [patientRef, comms] of byPatient) {
      const patient = this.store.read("Patient", patientRef.split("/")[1]);
      const phone = ((patient.telecom as { system: string; value: string }[] | undefined) ?? []).find((t) => t.system === "phone")?.value;
      const nhs = ((patient.identifier as { system: string; value: string }[] | undefined) ?? []).find((i) => i.system === NHS_NUMBER_SYSTEM)?.value;
      if (!phone || !nhs) {
        this.log(now, "dispatch_skipped_no_phone", patientRef);
        results.push({ patientRef, status: "not_sent", reason: "no_phone_on_record" });
        continue;
      }
      const categories = new Set(comms.map((c) => (c.category as { text: OutreachType }[])[0].text));
      let types = OUTREACH_TYPES.filter((t) => categories.has(t));
      if (types.includes("rebook_missed")) types = types.filter((t) => t !== "book_review"); // the rebooked appointment is the review

      const record = this.transport.requestOutreach({
        outreachTypes: types,
        patientNhsNumber: nhs,
        phone,
        script: this.script(patient, types),
        authorisedBy: [...new Set(comms.map((c) => (c.requester as { reference: string }).reference))].sort(),
        communicationRequests: comms.map(refOf)
      });
      for (const c of comms) this.store.update({ ...c, identifier: [{ system: "urn:aksh:access-outreach", value: record.outreachId }] });
      this.log(now, "dispatched", `${patientRef}: ${types.join("+")} as ${record.outreachId}`);
      results.push(record);
    }
    return results;
  }

  private script(patient: FhirResource, types: OutreachType[]): string {
    const given = (patient.name as { given?: string[] }[] | undefined)?.[0]?.given?.[0] || "there";
    const phrases = types.map((t) => OUTREACH_PHRASES[t]);
    const items = phrases.length === 1 ? phrases[0] : `${phrases.slice(0, -1).join(", ")} and ${phrases[phrases.length - 1]}`;
    return `Hello ${given}, this is ${this.serviceName} calling to arrange ${items}.${CLOSING}`;
  }

  private pendingProposal(id: string): AccessProposal {
    const p = this.proposals.get(id);
    if (!p) throw new Error(`Unknown proposal ${id}`);
    if (p.status !== "pending") throw new Error(`${id} is ${p.status}, not pending`);
    return p;
  }

  private practitioner(clinicianId: string, now: Date): string {
    if (!(clinicianId in this.authorisedClinicians)) {
      this.log(now, "blocked_unauthorised", clinicianId);
      throw new Error(`${clinicianId} is not an authorised clinician`);
    }
    if (!this.store.exists("Practitioner", clinicianId)) {
      this.store.create({ resourceType: "Practitioner", id: clinicianId, name: [{ text: this.authorisedClinicians[clinicianId] }] });
    }
    return `Practitioner/${clinicianId}`;
  }
}
