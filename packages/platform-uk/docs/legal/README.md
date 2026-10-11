# Legal review pack — data processing agreement and privacy assessment

**Status: DRAFT for qualified legal review. Not legal advice. Not for signature until a reviewer has approved it.**
Prepared 2026-10-11 from the platform as built (code, database migrations 017–031, hosting configuration).

The go-live checklist asks every organisation for (1) a signed data processing agreement and (2) a completed privacy
impact assessment. This pack gives a reviewer what they need to approve the templates we will hand to organisations.

| File | What it is | Reviewer's job |
| --- | --- | --- |
| `DATA_PROCESSING_AGREEMENT_DRAFT.md` | Template agreement between a care organisation (controller) and Aksh (processor) | Confirm structure, fill jurisdiction-specific clauses, approve or redline |
| `PRIVACY_IMPACT_ASSESSMENT_GUIDANCE.md` | Guidance and pre-filled facts for an organisation's own assessment | Confirm the facts are described accurately and the risk statements are fair |
| This file | Facts, open questions, decisions needed | Answer the open questions |

## Who the reviewer should be

A data-protection lawyer (or the organisation's data protection officer for a first pilot) with health-data experience in
the jurisdiction of the first live organisation. Aksh is country-neutral; each launch jurisdiction needs its own sign-off
on the clauses marked **[JURISDICTION]**.

## What the platform processes (as built)

- **Organisations and staff:** names, work emails, roles, professional registration numbers and the result of checks
  against official registers.
- **Patients (special category / health data):** identity (name, date of birth, record number), diabetes type, contact
  details and preferred channel, clinical observations (HbA1c, glucose, blood pressure, weight and others), medicines,
  care team, consent decisions, waiting-list entries, slot offers and responses.
- **Patient-entered readings:** recorded by the patient; stored as patient-reported and unverified until a clinician
  checks them; never used in risk or care-gap calculations before that.
- **Operational records:** audit events, go-live evidence, connector messages, error events (scrubbed of emails, numbers,
  dates, identifiers and database key values before storage).

## Where it is processed (sub-processors)

| Service | Purpose | Location | Patient data? |
| --- | --- | --- | --- |
| Neon (on AWS) | Production database | eu-west-2 (London) | Yes |
| Vercel | Application hosting and serverless functions | `lhr1` (London), set in `vercel.json` (decided 2026-10-11; previously `iad1`, Washington DC) | Yes, in transit and in memory during requests |
| Resend | Transactional email (invites, notifications, error alerts) | See Resend's data processing terms | Email addresses; error alerts contain scrubbed text only |
| OpenAI (API, Aksh's own key; Vercel AI Gateway only if no key is set) | Website chat assistant (`/api/chat`), demo patient chat (`/api/chat/patient`), optional clinical drafting agents (off unless enabled) | OpenAI API region (USA by default; check OpenAI's data residency options) | Visitors and users may type health information; the demo chat's record context is synthetic only. Kept by founder decision 2026-10-11, see question 5. |

Not used in production today (no credentials set): Medplum, Neo4j, Deepgram (speech), EMIS partner sandbox, Fitbit,
FastAPI synthesis service, Sentry.

## Security measures in place (for the agreement's security schedule)

- Encryption in transit (TLS) to the application and to the database; encryption at rest by the database provider.
- Row-level security in the database: every request runs as a restricted role scoped to the user's organisations and
  linked patient record; policies fail closed.
- Append-only records for consent, audit, go-live evidence, registration checks and connector messages (enforced by
  database triggers).
- Passwords hashed (bcrypt); sessions expire after 24 hours; invite codes and connector API keys stored only as hashes.
- Separation of environments: production holds real organisations only; test and rehearsal data live in a separate
  database; scripts that create test data refuse to run against production.
- Shadow mode: Aksh never contacts patients or books appointments itself; staff decide and act.
- Go-live requires evidence (this agreement, the assessment, a named clinical safety lead with a checked registration,
  an agreed contact channel and a locked baseline) and approval by an Aksh reviewer who is not a member of the
  organisation.

## Open questions for the reviewer

1. **Roles.** We assume the care organisation is the controller and Aksh the processor for clinical data. For accounts
   that patients create themselves before linking to a clinic (and readings they record then), is Aksh the controller?
   The draft treats that as a separate controller relationship covered by Aksh's own privacy notice.
2. **Lawful basis and condition for health data** in the launch jurisdiction (e.g. provision of health care by or under
   the responsibility of a health professional). **[JURISDICTION]**
3. **International transfers.** Hosting compute was in the USA (see table). Once moved to London, are any transfer
   mechanisms still needed for Vercel (support access) and Resend? **[JURISDICTION]**
4. **Retention.** No automatic deletion is implemented yet. What periods should apply to patient records after an
   organisation leaves, to audit records, to error events (proposed: 90 days) and to connector messages?
5. **Cloud AI (decided: kept, using OpenAI directly).** Reviewer to confirm: OpenAI's data processing addendum signed;
   zero data retention or the shortest retention available enabled for the API project; data residency (UK/EU) if
   offered for the account; privacy notice wording for the chat ("do not enter personal health details" or a lawful
   basis for doing so); and that no real patient record is ever added to a prompt without a fresh assessment.
6. **Medical device status.** Flagged patient readings show general safety wording (follow your own plan; call the
   emergency number). Does this, or the slot-fill matching, bring the product into medical-device regulation in the
   launch jurisdiction? (Engineering view: information only, no treatment decisions, but this needs a regulatory
   opinion, not ours.)
7. **Breach notification** timescales and contacts to put in the agreement. **[JURISDICTION]**

## Decisions needed from Aksh (founder)

- Appoint the reviewer and the Aksh contact for data protection queries.
- Sign OpenAI's data processing addendum and set retention for the API project before real users chat.
