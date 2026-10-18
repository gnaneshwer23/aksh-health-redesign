# Aksh Health — public site content audit and consolidation

**Date:** 18 October 2026 · **Base:** `main` at `05bc220` · Pages audited on production: `/`, `/platform`, `/product`,
`/security`, `/resources` (+ guides), `/contact`, `/get-started`.

## Findings

| # | Finding | Where | Change |
|---|---|---|---|
| C1 | Slot fill and glucose monitoring explained in full three times (home, How it works, Available now) plus the guides | `/`, `/platform`, `/product` | One job per page: Home = summary; How it works = step by step; Available now = what is included (spec); guides = how to use. Product narrative paragraphs replaced by one-line intros and "Step by step →" links |
| C2 | Contradiction: Available now said "four workflows in production", home said "two workflows" | `/product` | "Two workflows … supported by the patient app and weekly results" |
| C3 | Overclaim: Available now meta said "in production with clinics today" (no organisation is live) | `/product` metadata | Reworded to what is included |
| C4 | Call to action had four names: Request access, Request an organisational pilot, Bring Aksh to your clinic, See the features | nav, footer, contact, get-started, page CTAs | "Request a pilot" (nav, footer, contact, page CTAs); hero and form title "Request an organisational pilot"; one shared `PilotCta` component |
| C5 | Same final CTA text ("See it with your own waiting list") on two pages, different from home | `/platform`, `/product` | Shared `PilotCta` |
| C6 | Home repeated itself: "No patient data sent to AI" in two sections; "What Aksh will not do" and the clinician-control section overlapped | `/` | Limits moved to How it works (with the named-person decisions); home keeps one control section |
| C7 | Diabetes capabilities listed twice with statuses (home "diabetes areas" grid and the How it works pillars), with different wording | `/`, `/platform` | One capability list on How it works (`#capabilities`), all 18 capabilities from the register; home links to it |
| C8 | Pillar called "Clinical review" contained production CGM monitoring, while home said clinical review is "in validation" | `/platform` | Pillars renamed "Appointments" and "Diabetes care"; home section renamed "Clinical drafts, in validation" |
| C9 | "Outcomes" tiles claimed "Safer medicines", an in-validation capability | `/platform` | Removed |
| C10 | "10 capabilities in production" counted infrastructure as capabilities | `/` | Removed; replaced with what supports the two workflows |
| C11 | Access form asked 8 fields plus 12 checkboxes (systems, commitments) before first contact | `/get-started`, `lib/access-requests/validation.ts` | Six fields; systems and go-live commitments optional in the API (default empty) and covered on the scoping call; privacy note beside submit |
| C12 | Named-person decisions list unreadable (white on light) after the move; security link invisible on dark | `/platform#control` | Section uses the dark style; link is a button |

Not changed (checked, no repetition problem): Security (one place for controls), Resources and guides, legal pages.

## Page roles after this change

- **Home:** what Aksh is for, the two workflows in brief (how it works / what staff do / what you measure), how a pilot runs, clinician control, what comes next (in validation), CTA.
- **How it works:** where Aksh sits, both workflows step by step, every capability with its status, what Aksh will not do and who must decide, what you need to start, CTA.
- **Available now:** what each production workflow includes, the patient app, how results are measured, roles, connections, CTA.
- **Request a pilot:** six questions and what happens next.

## Tests

- `e2e/marketing.spec.ts`: home has no capability list or limits (they live on How it works); How it works has limits and the full list; Available now says two workflows and links to the step-by-step; form has six fields and submits; CTA label "Request a pilot" in nav and contact.
- `tests/access-request-validation.test.ts`: six fields accepted, optional detail accepted, unknown values and missing required fields refused. Added to `test:clinical-proof`.
- Results (local): marketing + accessibility e2e 21 passed; `test:clinical-proof` passed; typecheck and build clean.

## Rollback

Revert the merge commit on `main`. No data migration; access requests saved with empty systems/commitments remain valid.
