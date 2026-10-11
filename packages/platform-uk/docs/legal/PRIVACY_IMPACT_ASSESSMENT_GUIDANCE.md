# Privacy impact assessment — guidance for organisations using Aksh

**DRAFT for qualified legal review.** The organisation (controller) owns its assessment. This guidance gives the facts
about Aksh so the organisation does not have to discover them, and suggests risks and mitigations to consider. The go-live
checklist asks for the completed assessment's reference, completion date and residual risk; **high residual risk blocks
go-live** until it is reduced.

## 1. Describe the processing

Use Schedule 1 of the data processing agreement. In plain words for the assessment:

> We use Aksh to keep a waiting list of patients who need diabetes appointments and, when an appointment is cancelled,
> to see which of those patients fit the freed slot under our own rules. Our staff decide whom to offer it to, send the
> offer themselves, and confirm the booking. Patients can link an Aksh account to see their record and send us their
> own readings, which our clinicians check before they count.

## 2. Necessity and proportionality — questions to answer

- Which patients will be loaded (all patients with diabetes, or only those on a waiting list)? Load only what you need.
- Which contact channel will staff use, and how do patients opt out? (Also a go-live item.)
- Who in your organisation can see what? Aksh roles: physician, nurse, pharmacist, manager/admin. Review who is admin.
- How will you tell patients? Update your privacy notice to mention Aksh as a processor.

## 3. Risks to consider (with what Aksh already does)

| Risk to people | Likelihood / severity (your view) | Already in place in Aksh | Your additional measures |
| --- | --- | --- | --- |
| Staff see records they should not | | Database-level access scoped to your organisation; roles; audit trail | Keep the staff list current; suspend leavers (Staff tab) |
| A patient is offered a slot that is wrong for them | | Rules are yours and shown with reasons; staff approve every step; nothing is sent by Aksh | Train staff; review the matching rules |
| Message reaches the wrong person | | Contact channel and opt-out are agreed at go-live; staff send messages | Verify contact details on import |
| Patient-entered readings are wrong or alarming | | Stored as unverified; excluded from risk scores until checked; flagged readings shown first to clinicians; patient sees general safety wording with your emergency number | Agree who checks readings and how often; tell patients readings are not watched around the clock |
| Data processed outside your jurisdiction | | Database and application hosting in London; sub-processors listed | Confirm transfer safeguards with your adviser |
| Data kept too long | | Not yet automatic | Set retention periods in the agreement (pack README question 4) |
| Security breach | | Encryption, hashed credentials, separation of test and live data, append-only audit | Breach contacts in the agreement; staff password hygiene |
| Cloud AI processing of health data | | Your patient records are not sent to AI; chat assistants send what users type to OpenAI to reply | Tell staff and patients not to type identifiable details into chat; check Aksh's OpenAI terms |

## 4. Residual risk

After your additional measures, rate the remaining risk **low**, **medium** or **high**. If high, consult your regulator
before processing **[JURISDICTION]**; Aksh will not approve go-live with high residual risk.

## 5. Sign-off

Record who completed the assessment, the data protection officer's advice, the decision, and the review date (at least
yearly, or when you change how you use Aksh). Enter the reference in Aksh → Organisation → Go-live → Privacy impact
assessment.
