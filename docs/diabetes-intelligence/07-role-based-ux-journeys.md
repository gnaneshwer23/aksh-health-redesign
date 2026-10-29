# 07 — Role-based UX journeys

Clinical workspace visual language: restrained white / blue / teal tokens; do not replace marketing lime/beige in the same PR.

## Synthetic demo patient (investor / clinical walkthrough)

1. Open `/dashboard/gp/diabetes-journey/[patientId]`
2. See **history** with missing-data chips where fields absent
3. See **glucose observations** + completeness bar
4. Request / view **care plan draft**
5. Clinician **Accept / Edit / Reject**
6. On Accept: follow-up task appears with owner + due time
7. Timeline updates with each event (no detached promo badges)

## GP / clinical reviewer

| Step | Surface | Action |
|------|---------|--------|
| Identify patient | GP patients list or journey URL | Open 360/journey |
| Review history + glucose | Journey workspace | Note missing data |
| Review draft plan | Care plan panel | Accept / Edit / Reject |
| Confirm follow-up | Follow-up list | Acknowledge / complete |
| Audit | Timeline + SHIELD (where wired) | Read-only |

**Never:** autonomous prescribe, silent EHR write, hide missing data.

## Nurse / monitoring

- Continues using `/dashboard/monitoring` and CGM worklists for production glucose ops.
- Journey follow-ups may later route to nurse queue; **not** claimed live in this slice.

## Patient

- Patient app readings remain on `/dashboard/patient` + readings APIs.
- Journey care plans are **clinician-gated**; patient sees only approved summaries when a patient companion mode is added (planned — not in this slice beyond honesty labels).

## Front desk / access

- Slot-fill and handoffs stay on access dashboards; separate from care-plan follow-ups until an ADR unifies queues.
