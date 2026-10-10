# Patient Access module and Asha (patient voice companion)

**Status:** Track A build (synthetic patients, simulated telephony, no live write). Not approved for real patients.
**Date:** 2026-10-10
**Relates to:** `PATIENT_ACCESS_INTEGRATION.md` (staged vendor adapter), Volume I Ch.3 personas, Ch.5 HITL, `AKSH_VISION_PRD_OVERVIEW.md`.

---

## 1. What we're adding and why

The patient-access pattern (inbound contact, outbound campaigns and open slots, handled by an AI agent that schedules, processes referrals, answers routine questions and hands edge cases to staff, priced on verified lift) is now an established product category:
- **US:** Parakeet Health ($10M Series A, Oct 2026; pay-for-performance pricing; vendor-reported lift, not independently verified).
- **UK general practice:** InTouchNow (£2.3M, Sep 2026; reports calls answered 55.9% → 65.6% across 18 practices, vendor analysis), Wavenet AI reception, and others booking into EMIS / SystmOne.

Booking alone is a commodity. Aksh's angle is that **every patient conversation feeds the same clinical loop**:
- what a patient tells the voice agent becomes a structured, patient-reported, unverified draft;
- it lands in the GP / nurse review queue;
- a named clinician decides;
- the decision is audited in SHIELD;
- outbound check-ins close the loop for the diabetes cohort.

Access improves, and clinicians get better signal without more admin.

## 2. Blockers first (none are code)

| # | Blocker | Why it applies | Status |
| --- | --- | --- | --- |
| 1 | **Live PHI / Track B** | A patient-facing voice agent on a real phone line processes special category data (GDPR Art. 9). | NO-GO until DPIA, DSPT, DCB0129 (Aksh) + DCB0160 (practice). |
| 2 | **MHRA device status** | Collecting symptoms and routing urgency is close to triage. Software informing diagnostic or treatment decisions is typically Rule 11, at least Class IIa. MHRA's AI-specific framework is still pending (2026). | Design keeps Asha **non-diagnostic**: fixed safety-net script, no advice, everything clinical goes to a human. Needs a regulatory opinion before live use. |
| 3 | **Ambient / voice AI guidance** | NHS England AVT guidance requires a clinical safety case, hazard log, DPIA and monitoring for voice products that document or summarise. | Hazard log entries drafted below; CSO sign-off missing. |
| 4 | **Automated outbound calls** | PECR / Ofcom rules on automated calls; consent and contact preference must be checked; call recording notice. | Campaigns require clinician approval + contact-preference flag; telephony is simulated. |
| 5 | **Not an EHR (NO-3)** | "Patient data creates the EHR" would make Aksh a system of record. | Asha creates **patient-reported FHIR drafts**; only a clinician Accept stages them via BRIDGE for the GP record. |
| 6 | **Clinical thresholds** | Red-flag phrases, glucose/BP thresholds and campaign rules are clinical content. | Defaults set, `thresholdsClinicallySignedOff: false` until CSO sign-off. |

## 3. Naming

Public pages lead with human labels (23 Jul 2026 decision). Names should be easy to say on a phone line and not collide with clinical terms.

| Role | Name | Rationale |
| --- | --- | --- |
| Patient-facing voice & chat companion (replaces "Akshu") | **Asha** | "Hope"; two clear syllables on a phone line; warm without being a person's nickname for the brand. Alternatives considered: Sahay ("help"), Nia, Ava (taken by several products). |
| Practice-side automation | **Front Desk** | Says what it does. Covers the workflows below; one module, not a set of new agents. |
| Workflows (human labels) | Answer · Recall · Slot Fill · Referral Desk · Answers · Hand-off | Map one-to-one to the diagram: inbound contact, outbound campaigns, open slots, referral processing, routine questions, staff hand-off. |

**Architecture choice (keeps the 12-agent roster intact).** Front Desk is a **module** like Aksh Diabetes, not new peer agents (NO-8, N4 lock). Asha is a patient-facing **channel of CANVAS** (capture), the way VOICE dictation is for clinicians. Safety holds route through GUARDIAN-style escalation; everything is audited by SHIELD and staged by BRIDGE only after Accept.

## 4. End-to-end flow

```text
Inbound (call / SMS / web / staff-entered)     Outbound (Recall campaigns)      Open slots (cancellations)
          │                                            │ clinician-approved              │
          ▼                                            ▼                                ▼
                    Front Desk conversation engine (Asha voice/chat or staff console)
   every turn → Safety screen (999 / 111 safety-net, crisis, acute diabetes) → immediate hand-off
          │ identify patient (name + DOB; synthetic cohort)  → intent router
          ├─ Scheduling: book / move / cancel against the practice calendar (idempotent)
          ├─ Referral Desk: referral letter → structured intake → booking proposal
          ├─ Answers: retrieval over the practice knowledge base, cited; no clinical advice
          ├─ Health update (Asha): readings + symptoms → patient-reported, unverified drafts
          └─ Anything else / low confidence → Hand-off to staff (reason recorded)
          ▼
  Work items (queue) → clinician review for clinical drafts (Accept / Edit / Reject) → BRIDGE stage
          ▼
  SHIELD audit on every decision · Metrics: baseline locked before go-live → verified lift
```

## 5. Scope of this build

| Piece | Built now (Track A) | Later (Track B / partner) |
| --- | --- | --- |
| Safety screen | Deterministic, every turn; reuses `detectCheckInEscalation` + acute emergency cues | CSO-signed thresholds; clinical safety case |
| Conversation engine | Turn-based state machine, text + browser voice (Web Speech) | Telephony transport (e.g. Twilio / NHS cloud telephony) behind `AccessTelephonyTransport` |
| Scheduling | Synthetic practice calendar, book/move/cancel, waitlist slot-fill | GP Connect Appointment Management (EMIS / SystmOne) |
| Referral Desk | Structured intake from referral text → booking proposal | e-RS / fax ingestion |
| Answers (RAG) | Cited retrieval over a curated practice knowledge base | Practice-authored content, governed updates |
| Health capture | Glucose, HbA1c, BP, weight, adherence, symptoms → unverified FHIR drafts → review queue | Device / CGM connectors |
| Recall campaigns | Missed / lapsed / recall / check-in; clinician-approved; simulated calls | Live dial-out with consent + contact preference |
| Metrics | Baseline snapshot and lift, synthetic | Verified against practice telephony / appointment data |
| Storage | In-process store + SHIELD audit for decisions | Migration `016` (Aksh schema) once approved for the shared database |

## 6. Hazard log (draft, for CSO review)

| ID | Hazard | Control |
| --- | --- | --- |
| H-ACC-1 | Emergency described to the agent is not escalated | Safety screen runs before intent handling on every turn; emergency → fixed 999 script + immediate staff hand-off; tested phrases |
| H-ACC-2 | Agent gives clinical advice | Answers only from curated non-clinical KB with citations; clinical questions → hand-off; no generation of advice |
| H-ACC-3 | Wrong patient identified | Name + DOB match required before any booking or disclosure; mismatch → hand-off |
| H-ACC-4 | Patient-reported value treated as verified | All Asha data tagged patient-reported/unverified; cannot close a care gap; clinician Accept required |
| H-ACC-5 | Automated outbound call to non-consenting patient | Campaign requires clinician approval and contact-preference = phone; simulated only |
| H-ACC-6 | Double booking / lost slot | Idempotent booking keyed by slot; move = atomic cancel + book |
