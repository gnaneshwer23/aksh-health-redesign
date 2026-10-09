"""Patient-access intake adapter: vendor events → FHIR R4 resources.

Principles enforced here:
  * Every resource created from a vendor event is tagged SOURCE_TAG and gets a
    Provenance pointing at the vendor Device and the originating event id.
  * Patient-reported clinical data is stored as *unverified*:
    Observation.status = preliminary, Condition.verificationStatus = unconfirmed.
  * Vendor data never overwrites an existing EHR Patient record.
"""
from __future__ import annotations

from .fhir import (
    HBA1C,
    HYPO_COUNT,
    NHS_NUMBER,
    SOURCE_TAG,
    UCUM,
    FHIRStore,
    iso,
    ref,
)
from .vendor_mock import AccessEvent

VENDOR_DEVICE = {
    "resourceType": "Device",
    "id": "parakeet-patient-access",
    "deviceName": [
        {
            "name": "Parakeet Health patient-access agent (mock)",
            "type": "user-friendly-name",
        }
    ],
}


class PatientAccessAdapter:
    def __init__(self, store: FHIRStore, device: dict | None = None) -> None:
        self.store = store
        self.device = device or VENDOR_DEVICE
        if not store.exists("Device", self.device["id"]):
            store.create(self.device)

    # -- public ---------------------------------------------------------------
    def ingest(self, event: AccessEvent) -> dict:
        created: list[str] = []
        updated: list[str] = []
        patient, new_patient = self._patient(event)
        if new_patient:
            created.append(ref(patient))

        handler = {
            "referral.received": self._referral,
            "intake.completed": self._intake,
            "appointment.booked": self._booked,
            "appointment.no_show": self._no_show,
        }[event.type]
        handler(event, patient, created, updated)

        if created or updated:
            activity = "CREATE" if created else "UPDATE"
            self._provenance(event, created + updated, activity)
        return {
            "patient_id": patient["id"],
            "created": created,
            "updated": updated,
        }

    # -- helpers --------------------------------------------------------------
    def _meta(self, event: AccessEvent) -> dict:
        return {
            "tag": [SOURCE_TAG],
            "source": f"urn:parakeet:event:{event.event_id}",
        }

    def _patient(self, event: AccessEvent) -> tuple[dict, bool]:
        p = event.payload["patient"]
        matches = self.store.search(
            "Patient",
            lambda r: any(
                i.get("system") == NHS_NUMBER and i.get("value") == p["nhs_number"]
                for i in r.get("identifier", [])
            ),
        )
        if matches:
            # Existing EHR patient — never modify.
            return matches[0], False

        resource: dict = {
            "resourceType": "Patient",
            "meta": self._meta(event),
            "identifier": [{"system": NHS_NUMBER, "value": p["nhs_number"]}],
            "name": [{"family": p.get("family", ""), "given": [p.get("given", "")]}],
            "birthDate": p.get("birth_date"),
            "gender": p.get("gender", "unknown"),
        }
        if p.get("phone"):
            resource["telecom"] = [
                {"system": "phone", "value": p["phone"], "use": "mobile"}
            ]
        return self.store.create(resource), True

    def _referral(
        self,
        event: AccessEvent,
        patient: dict,
        created: list[str],
        updated: list[str],
    ) -> None:
        pl = event.payload
        sr = self.store.create(
            {
                "resourceType": "ServiceRequest",
                "meta": self._meta(event),
                "status": "active",
                "intent": "order",
                "code": {"text": pl.get("reason", "Referral")},
                "subject": {"reference": ref(patient)},
                "requester": {"display": pl.get("referrer", "Unknown referrer")},
                "authoredOn": iso(event.occurred_at),
                "note": [{"text": pl.get("letter_text", "")}],
            }
        )
        created.append(ref(sr))

    def _intake(
        self,
        event: AccessEvent,
        patient: dict,
        created: list[str],
        updated: list[str],
    ) -> None:
        pl, pref = event.payload, ref(patient)
        for med in pl.get("medications", []):
            ms = self.store.create(
                {
                    "resourceType": "MedicationStatement",
                    "meta": self._meta(event),
                    "status": "active",
                    "medicationCodeableConcept": {"text": med},
                    "subject": {"reference": pref},
                    "informationSource": {"reference": pref},
                    "dateAsserted": iso(event.occurred_at),
                }
            )
            created.append(ref(ms))

        for cond in pl.get("conditions", []):
            c = self.store.create(
                {
                    "resourceType": "Condition",
                    "meta": self._meta(event),
                    "clinicalStatus": {
                        "coding": [
                            {
                                "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
                                "code": "active",
                            }
                        ]
                    },
                    "verificationStatus": {
                        "coding": [
                            {
                                "system": "http://terminology.hl7.org/CodeSystem/condition-ver-status",
                                "code": "unconfirmed",
                            }
                        ]
                    },
                    "code": {"text": cond},
                    "subject": {"reference": pref},
                }
            )
            created.append(ref(c))

        if pl.get("reported_hba1c"):
            r = pl["reported_hba1c"]
            o = self.store.create(
                {
                    "resourceType": "Observation",
                    "meta": self._meta(event),
                    "status": "preliminary",
                    "code": {"coding": [HBA1C]},
                    "subject": {"reference": pref},
                    "effectiveDateTime": r["date"],
                    "valueQuantity": {
                        "value": r["value"],
                        "unit": "mmol/mol",
                        "system": UCUM,
                        "code": "mmol/mol",
                    },
                    "performer": [{"reference": pref}],
                }
            )
            created.append(ref(o))

        if "hypo_episodes_30d" in pl:
            o = self.store.create(
                {
                    "resourceType": "Observation",
                    "meta": self._meta(event),
                    "status": "preliminary",
                    "code": {"coding": [HYPO_COUNT]},
                    "subject": {"reference": pref},
                    "effectiveDateTime": iso(event.occurred_at),
                    "valueInteger": int(pl["hypo_episodes_30d"]),
                    "performer": [{"reference": pref}],
                }
            )
            created.append(ref(o))

    def _booked(
        self,
        event: AccessEvent,
        patient: dict,
        created: list[str],
        updated: list[str],
    ) -> None:
        pl = event.payload
        a = self.store.create(
            {
                "resourceType": "Appointment",
                "meta": self._meta(event),
                "status": "booked",
                "start": pl["start"],
                "serviceType": [{"text": pl.get("service", "Diabetes review")}],
                "participant": [
                    {"actor": {"reference": ref(patient)}, "status": "accepted"}
                ],
            }
        )
        created.append(ref(a))

    def _no_show(
        self,
        event: AccessEvent,
        patient: dict,
        created: list[str],
        updated: list[str],
    ) -> None:
        pl, pref = event.payload, ref(patient)
        appts = self.store.search(
            "Appointment",
            lambda a: a.get("start") == pl["start"]
            and any(
                p.get("actor", {}).get("reference") == pref
                for p in a.get("participant", [])
            ),
        )
        if appts:
            a = appts[0]
            a["status"] = "noshow"
            self.store.update(a)
            updated.append(ref(a))
        else:
            a = self.store.create(
                {
                    "resourceType": "Appointment",
                    "meta": self._meta(event),
                    "status": "noshow",
                    "start": pl["start"],
                    "serviceType": [{"text": pl.get("service", "Diabetes review")}],
                    "participant": [
                        {"actor": {"reference": pref}, "status": "accepted"}
                    ],
                }
            )
            created.append(ref(a))

    def _provenance(
        self, event: AccessEvent, targets: list[str], activity: str
    ) -> None:
        self.store.create(
            {
                "resourceType": "Provenance",
                "target": [{"reference": t} for t in targets],
                "recorded": iso(event.occurred_at),
                "activity": {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/v3-DataOperation",
                            "code": activity,
                        }
                    ]
                },
                "agent": [
                    {
                        "type": {
                            "coding": [
                                {
                                    "system": "http://terminology.hl7.org/CodeSystem/provenance-participant-type",
                                    "code": "author",
                                }
                            ]
                        },
                        "who": {"reference": ref(self.device)},
                    }
                ],
                "entity": [
                    {
                        "role": "source",
                        "what": {
                            "identifier": {
                                "system": "urn:parakeet:event",
                                "value": event.event_id,
                            },
                            "display": f"{event.type} via {event.channel}",
                        },
                    }
                ],
            }
        )
