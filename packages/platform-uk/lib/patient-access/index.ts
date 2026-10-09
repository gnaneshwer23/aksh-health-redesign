/**
 * Patient access integration (synthetic, staged). Entry point.
 * Registered as `patient-access-synthetic` in lib/integration-config.ts, disabled by default.
 */
import { ingestAccessEvent } from "./adapter";
import { InMemoryFhirStore } from "./fhir";
import { MockAccessService, PatientAccessGate, type AccessServiceTransport } from "./gate";
import { evaluatePatientAccessSignals, type PatientAccessThresholds } from "./signals";
import type { AccessEvent, AccessProposal } from "./types";

export * from "./types";
export { ingestAccessEvent, validateAccessEvent } from "./adapter";
export { evaluatePatientAccessSignals, PATIENT_ACCESS_THRESHOLDS } from "./signals";
export { MockAccessService, OUTREACH_PHRASES, PatientAccessGate } from "./gate";
export { InMemoryFhirStore, hba1cPercentToMmolMol } from "./fhir";

export function createPatientAccessPipeline(options: {
  authorisedClinicians: Record<string, string>;
  now?: () => Date;
  transport?: AccessServiceTransport;
  thresholds?: Partial<PatientAccessThresholds>;
  store?: InMemoryFhirStore;
}) {
  const store = options.store ?? new InMemoryFhirStore();
  const transport = options.transport ?? new MockAccessService();
  const gate = new PatientAccessGate(store, transport, options.authorisedClinicians);
  const now = options.now ?? (() => new Date());

  return {
    store,
    transport,
    gate,
    handle(event: AccessEvent): AccessProposal[] {
      const result = ingestAccessEvent(store, event);
      gate.log(now(), "ingested", `${event.type} via ${event.channel} (${event.eventId})`);
      return gate.propose(evaluatePatientAccessSignals(store, result.patientId, now(), options.thresholds), now());
    },
    accept: (id: string, clinicianId: string, note?: string) => gate.accept(id, clinicianId, now(), note),
    reject: (id: string, clinicianId: string, reason: string) => gate.reject(id, clinicianId, now(), reason),
    dispatch: () => gate.dispatchOutreach(now())
  };
}
