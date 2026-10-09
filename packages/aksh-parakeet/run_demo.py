"""Walk through the synthetic diabetes cohort end to end."""
from aksh_access.pipeline import AkshPatientAccessPipeline
from aksh_access.scenarios import (
    NOW,
    novak_events,
    okafor_events,
    patel_events,
    seed_ehr,
)

pipe = AkshPatientAccessPipeline(now=lambda: NOW)
seed_ehr(pipe.store)

for name, events in (
    ("Patel", patel_events()),
    ("Okafor", okafor_events()),
    ("Novak", novak_events()),
):
    print(f"\n=== {name} ===")
    for e in events:
        new = pipe.handle(e)
        print(f"  {e.type:<22} via {e.channel:<5} -> {len(new)} new proposal(s)")

print(
    f"\nBefore approval: DetectedIssue={pipe.store.count('DetectedIssue')}, "
    f"CommunicationRequest={pipe.store.count('CommunicationRequest')}, "
    f"outbound calls={len(pipe.vendor.outbound)}"
)

print("\n=== Clinician queue (highest severity first) ===")
for p in pipe.gate.pending():
    f = p.finding
    family = pipe.store.read("Patient", f.patient_id)["name"][0]["family"]
    print(
        f"  {p.id} [{f.severity:<8}] {family:<7} {f.rule_id}\n"
        f"      {f.summary}"
    )

# Approve Patel; reject Novak annual checks (new patient, booked at first review).
for p in list(pipe.gate.pending()):
    if (
        p.finding.rule_id == "annual-checks-overdue"
        and p.finding.patient_id != "patel"
    ):
        pipe.reject(
            p.id,
            "prac-001",
            "New patient; checks will be arranged at first review",
        )
    else:
        pipe.approve(p.id, "prac-001")

pipe.dispatch()
print(
    f"\nAfter approval: DetectedIssue={pipe.store.count('DetectedIssue')}, "
    f"CommunicationRequest={pipe.store.count('CommunicationRequest')}, "
    f"outbound calls={len(pipe.vendor.outbound)}"
)
print("\n=== Outbound requests sent to the (mock) vendor ===")
for o in pipe.vendor.outbound:
    print(f"  {o['patient_nhs_number']}  [{o['outreach_type']}]\n    \"{o['script']}\"")

print("\nPhase 6 complete. Full prototype ready for review.")
