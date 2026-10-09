/**
 * Minimal FHIR R4-shaped store + codes for the patient access adapter.
 * Same create/read/update/search shape as the subset of lib/medplum-client.ts
 * this module needs, so it can be swapped for the Medplum rehearsal later.
 */

export type FhirResource = { resourceType: string; id: string; meta?: { tag?: Coding[]; source?: string }; [key: string]: unknown };
export type Coding = { system: string; code: string; display?: string };

export const NHS_NUMBER_SYSTEM = "https://fhir.nhs.uk/Id/nhs-number";
export const LOINC = "http://loinc.org";
export const SNOMED = "http://snomed.info/sct";

export const CODES = {
  hba1c: { system: LOINC, code: "59261-8", display: "Hemoglobin A1c/Hemoglobin.total in Blood by IFCC protocol" },
  urineAcr: { system: LOINC, code: "9318-7", display: "Albumin/Creatinine [Mass Ratio] in Urine" },
  retinal: { system: "urn:aksh:annual-check", code: "retinal-screening", display: "Diabetic eye screening" },
  foot: { system: "urn:aksh:annual-check", code: "foot-check", display: "Diabetic foot examination" },
  hypoCount: { system: "urn:aksh:patient-reported", code: "hypo-episodes-30d", display: "Self-reported hypoglycaemia episodes, last 30 days" },
  t2d: { system: SNOMED, code: "44054006", display: "Type 2 diabetes mellitus" }
} satisfies Record<string, Coding>;

/** Every resource created from an access event carries this tag. */
export const EXTERNAL_ACCESS_TAG: Coding = {
  system: "urn:aksh:data-origin",
  code: "external-patient-access",
  display: "Captured by patient-access service; not clinically verified"
};

export const VERIFIED_OBSERVATION_STATUSES = new Set(["final", "amended", "corrected"]);

export const ANTICOAGULANTS = ["apixaban", "rivaroxaban", "edoxaban", "dabigatran", "warfarin"];
export const ANTIPLATELETS = ["aspirin", "clopidogrel", "prasugrel", "ticagrelor"];
export const HYPO_RISK_DRUGS = ["gliclazide", "glimepiride", "glipizide", "tolbutamide", "insulin"];

/** DCCT % -> IFCC mmol/mol (NGSP/IFCC master equation). */
export function hba1cPercentToMmolMol(percent: number): number {
  return Math.round((percent - 2.15) * 10.929);
}

export function refOf(r: FhirResource): string {
  return `${r.resourceType}/${r.id}`;
}

export function hasCode(r: FhirResource, coding: Coding): boolean {
  const codings = ((r.code as { coding?: Coding[] } | undefined)?.coding ?? []);
  return codings.some((c) => c.system === coding.system && c.code === coding.code);
}

export function isExternal(r: FhirResource): boolean {
  return (r.meta?.tag ?? []).some((t) => t.code === EXTERNAL_ACCESS_TAG.code);
}

export function toTime(iso: string): number {
  return new Date(iso.length === 10 ? `${iso}T00:00:00.000Z` : iso).getTime();
}

export class InMemoryFhirStore {
  private data = new Map<string, Map<string, FhirResource>>();
  private seq = 0;

  private bucket(type: string) {
    let b = this.data.get(type);
    if (!b) {
      b = new Map();
      this.data.set(type, b);
    }
    return b;
  }

  create<T extends Omit<FhirResource, "id"> & { id?: string }>(resource: T): FhirResource {
    const copy = structuredClone(resource) as unknown as FhirResource;
    if (!copy.id) copy.id = `${copy.resourceType.toLowerCase()}-${++this.seq}`;
    const b = this.bucket(copy.resourceType);
    if (b.has(copy.id)) throw new Error(`${copy.resourceType}/${copy.id} already exists`);
    b.set(copy.id, copy);
    return structuredClone(copy);
  }

  update(resource: FhirResource): FhirResource {
    const b = this.bucket(resource.resourceType);
    if (!b.has(resource.id)) throw new Error(`${resource.resourceType}/${resource.id} not found`);
    b.set(resource.id, structuredClone(resource));
    return structuredClone(resource);
  }

  read(type: string, id: string): FhirResource {
    const r = this.bucket(type).get(id);
    if (!r) throw new Error(`${type}/${id} not found`);
    return structuredClone(r);
  }

  exists(type: string, id: string): boolean {
    return this.bucket(type).has(id);
  }

  search(type: string, where?: (r: FhirResource) => boolean): FhirResource[] {
    return [...this.bucket(type).values()].filter((r) => !where || where(r)).map((r) => structuredClone(r));
  }

  count(type: string): number {
    return this.bucket(type).size;
  }
}
