# Data Processing Agreement — DRAFT

**DRAFT for qualified legal review. Not legal advice. Do not sign.** Clauses marked **[JURISDICTION]** must be completed
by the reviewer for the organisation's country. Structure follows the processor-contract requirements common to modern
data-protection laws (for example GDPR Article 28 and equivalents).

---

**Between**

- **[Organisation legal name]**, [address], [registration number] (the **Controller**), and
- **Aksh Health [legal entity]**, [address], [registration number] (the **Processor**).

**Effective date:** [date]  **Agreement reference:** [DPA-YYYY-NNN, version 1.0]

## 1. Subject matter and duration

1.1 The Processor provides the Aksh platform to the Controller: organisation workspace, patient records it imports or
creates, waiting lists, cancelled-slot matching in shadow mode, patient app accounts, schedule connector and related
features (the **Services**).
1.2 This agreement lasts as long as the Processor processes personal data for the Controller under the Services, and
continues until return or deletion under clause 10.

## 2. Nature, purpose and categories (Schedule 1)

The Processor processes personal data only to provide the Services, as described in Schedule 1.

## 3. Instructions

3.1 The Processor processes personal data only on the Controller's documented instructions, including this agreement
and the Controller's configuration of the Services, unless required by law (in which case the Processor informs the
Controller first unless the law prohibits it).
3.2 The Processor tells the Controller promptly if it believes an instruction breaks data-protection law.

## 4. Confidentiality

Everyone authorised by the Processor to process the personal data is bound by confidentiality.

## 5. Security (Schedule 2)

The Processor maintains the technical and organisational measures in Schedule 2 and reviews them at least yearly.

## 6. Sub-processors (Schedule 3)

6.1 The Controller authorises the sub-processors listed in Schedule 3.
6.2 The Processor gives at least **[30]** days' notice of a new or replacement sub-processor. The Controller may object
on reasonable data-protection grounds; if the parties cannot resolve the objection, the Controller may end the Services
without penalty.
6.3 The Processor imposes equivalent obligations on each sub-processor and remains responsible for them.

## 7. International transfers [JURISDICTION]

The Processor does not transfer personal data outside **[jurisdiction/region]** except as listed in Schedule 3 and with
the safeguards stated there.

## 8. Assistance

8.1 The Processor helps the Controller respond to data-subject requests (access, correction, erasure, restriction,
portability, objection), taking into account the nature of the processing.
8.2 The Processor helps the Controller with security, breach notification, privacy impact assessments and prior
consultation with a regulator, using the information in this pack.

## 9. Personal data breaches [JURISDICTION]

9.1 The Processor notifies the Controller without undue delay, and in any event within **[24/48]** hours of becoming
aware of a personal data breach affecting the Controller's data, with the information available at the time.
9.2 Contacts: Controller **[name, email, phone]**; Processor **[name, email, phone]**.

## 10. End of the Services

On ending the Services the Processor, at the Controller's choice, returns the personal data (machine-readable export) and
deletes the remaining copies within **[60]** days, unless law requires storage. Append-only audit records are retained
for **[period]** for accountability. **[Reviewer: confirm retention periods; see pack README, question 4.]**

## 11. Audit

The Processor makes available the information needed to demonstrate compliance and allows audits by the Controller or
its appointed auditor, with reasonable notice, at most once a year unless after a breach.

## 12. Liability and law [JURISDICTION]

Liability follows the main services agreement. Governing law and courts: **[jurisdiction]**.

---

## Schedule 1 — Processing details

| | |
| --- | --- |
| **Data subjects** | Patients of the Controller; the Controller's staff; patients who link their own Aksh account to the Controller's record |
| **Personal data** | Identity (name, date of birth, record number), contact details and preferred channel; staff work email, role, professional registration number and check results |
| **Special category data** | Health data: diabetes type, observations (HbA1c, glucose, blood pressure, weight, kidney and lipid results, continuous-glucose summaries), medicines, care team, consent decisions, appointment offers and responses, patient-entered readings |
| **Processing operations** | Storage; display to authorised staff; matching waiting-list patients to freed slots under the Controller's rules (staff decide every step); drafting offer wording for staff to send; recording patient readings; schedule read-back of bookings; audit |
| **AI processing** | Text typed into the chat assistants is sent to the AI sub-processor in Schedule 3 to generate a reply. The named-patient chat also sends a bounded chart summary of the patient being discussed; today that chat runs only on the synthetic demonstration cohort, never on the Controller's patient records. Before any of the Controller's records are used in an AI prompt, the parties update this agreement and the privacy impact assessment. Not used to train models **[confirm against the OpenAI addendum]**. |
| **Not done** | Aksh does not send appointment offers or other outreach to patients, book appointments, or make treatment decisions. It sends account emails (verification, password reset, invitations) to the people who use it. |
| **Duration** | For the term of the Services, then clause 10 |

## Schedule 2 — Security measures

- Encryption in transit (TLS) and at rest (database provider).
- Database row-level security for clinical and patient-record reads and writes: scoped to the user's organisations and linked patient; access fails closed. Listed service operations (sign-up and sign-in, invites and linking, organisation creation, go-live review, connector key checks, measurement summaries, error logging) run with owner rights behind application checks.
- Append-only records for consent, audit, go-live evidence, registration checks and connector messages.
- Passwords hashed; sessions expire after 24 hours; invite codes and API keys stored as hashes only; keys revocable.
- Separate production and test environments; test-data tooling refuses to run against production.
- Error monitoring stored in the Processor's own database: text fields are scrubbed of emails, numbers, dates,
  identifiers and database key values; the signed-in user's internal account ID is kept with browser error reports.
- Staff access by role; organisation admins manage staff; professional registrations checked against official registers.
- Go-live only after evidence review by an Aksh reviewer who is not a member of the organisation.

## Schedule 3 — Sub-processors

| Sub-processor | Service | Location | Safeguard [JURISDICTION] |
| --- | --- | --- | --- |
| Neon Inc. (on Amazon Web Services) | Database hosting | London (eu-west-2) | [ ] |
| Vercel Inc. | Application hosting | London (`lhr1`) | [ ] |
| Resend | Transactional email | [confirm] | [ ] |
| OpenAI | Chat assistants (text typed by users) | [USA unless data residency applies] | [ ] |

---

**Signed for the Controller** ______________________ Name / role / date

**Signed for the Processor** ______________________ Name / role / date
