# Cancelled-slot fill (patient access, shadow mode)

First commercial workflow from the v1.1 Commercial Execution PRD, built country-neutral and diabetes-first: when an appointment frees up, staff see which waiting-list patients fit, with reasons, ordered by the clinic's own rules (overdue care first by default). Staff decide every step. In shadow mode Aksh never sends a message or books an appointment.

Screen: `/dashboard/access` ("Fill slots" in the sidebar). Code: `lib/access/` (rules, workflow), `db/migrations/020_patient_access.sql`.

## Workflow

`SOURCE_VALIDATED → STAFF_REVIEW (ranked) → OFFER_DRAFTED → CONTACT_APPROVED (shadow: not sent) → PENDING_VERIFICATION → CLOSED (booked, verified)`

Side exits: `HANDOFF` (staff hand-off task with due time), `FAILED_SAFE` (read-back did not show the booking; hand-off created), `CLOSED` with outcome `expired`, `withdrawn` or `no_candidates`. A decline or no reply returns the slot to review; the patient keeps their place and is not re-offered the same slot.

## PRD requirements → status

| ID | Requirement | Status |
| --- | --- | --- |
| PA-01 | Ingest a slot source with attributes | Built: `POST /api/orgs/:id/slots`; source + sourceRef + version recorded; stale and malformed slots rejected |
| PA-02 | Deterministic eligibility rules | Built: `lib/access/eligibility.ts` (`slot-fill-rules-v1`); type, date window, notice, site, opt-out, contact preference, one live offer per patient, offer window |
| PA-03 | Ranked matches with reasons and exclusion codes | Built; ranking is clinic-ordered reason then longest wait, never clinical priority; missing data shown |
| PA-04 | Offer from approved, versioned template | Built: `offer-template-v1`, slot and organisation facts only, no clinical content |
| PA-05 | Staff-confirmed contact in shadow mode | Built: approval records `NOT_SENT_SHADOW_MODE`; no messaging adapter exists |
| PA-06 | No duplicate actions | Built: every action has an idempotency key (unique), workflow row locked per action, replays return the original result |
| PA-07 | Outcomes; "booked" only after authoritative confirmation | Built: accepted → `PENDING_VERIFICATION`; booked only on read-back with a source reference |
| PA-08 | Staff hand-off queue | Built: hand-off tasks with reason, context, priority, due time and overdue flag; acknowledge, then close as released or booked, so no patient is left stuck as offered |
| PA-09 | Contact preferences, opt-outs, suppression | Built: opt-out, missing contact preference, organisation frequency cap (offers per 30 days) and suppressed channels; per-patient suppression lists not yet |
| PA-10 | Expose environment, mode, policy version, state | Built: rule/template version, contact mode, environment on every workflow and action |
| PA-11 | Frozen baseline and metric definitions | Partly: `slot-fill-v1` fill rate with guardrails, labelled unverified; baseline locking with the pilot site not yet |
| PA-12 | Accept / edit / skip / defer / hand off, enforced server-side | Built: select, skip, edit offer (author recorded), defer (within the offer window), hand off, withdraw, record response, confirm |

## Safety properties (tested)

`tests/access-eligibility.test.ts` and `tests/access-workflow-db.test.ts` (real database) prove: exclusion codes and ranking, determinism, no clinical text in offers, idempotent replays, state guards, shadow mode, no booking without read-back, decline handling, failed-safe hand-off, organisation isolation (row-level security), patients cannot act, actions append-only. `e2e/slot-fill.spec.ts` drives the screen end to end.

## Next

Done since first cut: hand-off lifecycle, offer editing, defer, organisation settings (reason order, frequency cap, suppressed channels; admin-only, audited), daily expiry sweep (`/api/cron/access-expiry`, `CRON_SECRET`; awaiting read-back is handed off, never auto-expired).

Still to do: baseline locking with the pilot site, per-patient suppression lists, and a real schedule adapter (read-only first) behind an explicit environment flag.
