# Aksh Health — refinement brief: audit addendum and P0 (correctness and trust)

**Date:** 17 October 2026 · **Base:** `main` at `039b5b5` · Companion: `AKSH_PHASE1_AUDIT_20261015.md` (full inventory).

Founder decisions for this brief (17 Oct): no public demo for now (primary call to action is an organisational pilot);
all four capability statuses shown publicly; positioning for any diabetes care team, primary care first.

## 1. Audit addendum (what this brief asked for beyond the 15 Oct audit)

| # | Finding | Severity | User impact | Root cause | Change | Acceptance |
|---|---|---|---|---|---|---|
| A1 | Accept / Edit / Reject decided in the browser: the client applied the decision and saved the whole case; the server persisted what it was sent, including status and audit entries | Critical (before any clinical use) | A decision could be recorded without a real server decision; audit entries were client-authored | `updateQueueItemDecision` ran client-side; `PUT /api/review-cases/:id` accepted any payload | Server decision endpoint (below); generic save refuses decision changes | Decision only via server; tests below |
| A2 | No version check on review cases | High | Two reviewers could overwrite each other silently | No version field; upsert | Server-owned `version`; conditional update | Stale save returns 409 `STALE_CASE` |
| A3 | Durable audit for decisions was fire-and-forget | High | A decision could be stored with no audit record | `scheduleDurableShieldWrite` outside the save | Audit row written in the same transaction | Injected audit failure rolls the decision back |
| A4 | Editing a draft overwrote the generated text | Medium | Original and edited text could not both be seen | `applyQueueItemStatus` replaced `content` | `originalContent` kept on first edit | Test asserts both |
| A5 | Reviewer identity typed into a free-text box ("Dr Morgan") | High | Decisions attributed to whatever name was typed | UI passed `reviewerName` as `decidedBy` | Server records the signed-in account | Test asserts server identity |
| A6 | Capability status declared in several places (site data, docs) | Medium | Claims could drift apart | No single register | `lib/status/capabilities.ts` with evidence per claim | `tests/capability-status.test.ts` fails on a claim without existing evidence |
| A7 | Broken links / anchors | — | — | — | Crawled 21 public pages on production: none broken | — |
| A8 | GitHub Actions not starting (billing) | High (ops) | No CI on pull requests; uptime check stopped | Account spending limit / failed payment | Founder: fix billing | Uptime workflow runs again |

Still true from 15 Oct: the clinical review queue, drafts and FHIR staging are in validation (simulation only, closed in
production); production holds patient access, CGM monitoring, the patient app and the platform foundations.

## 2. Review-decision state rules (server)

`POST /api/review-cases/:id/items/:itemId/decision` with `{ action, expectedVersion, reason?, content?, offerHealthPlan? }`.

| From | Action | To | Rules |
|---|---|---|---|
| DRAFT | accept | ACCEPTED | role `clinical_reviewer`; persona decision scope (e.g. medication decisions) |
| DRAFT | edit | DRAFT (content changed) | text required, ≤ 20 000 chars; original text kept as `originalContent` |
| DRAFT | reject | REJECTED | reason required (≥ 3 chars) |
| ACCEPTED / REJECTED | any | — | 409 `ALREADY_DECIDED` |
| any | any with old `expectedVersion` | — | 409 `STALE_CASE`; the screen reloads the case |

On success, one transaction: case updated where `version = expectedVersion` (then `version + 1`), and the audit row
(actor = signed-in account, time, action, item, version change) inserted. Any failure rolls both back and returns 503
"The decision was not recorded." The learning record follows; its failure is reported in the response, not hidden.
Item decisions report `delivery: { staged: false, externalDelivery: "none" }`; nothing is delivered externally.
`PUT /api/review-cases/:id` refuses to change any item's decision (409 `USE_DECISION_ENDPOINT`), refuses stale versions,
and increments the version itself.

## 3. Files changed

- New: `lib/workflow/decide-review-item.ts`, `lib/repositories/review-decision-repository.ts`,
  `app/api/review-cases/[id]/items/[itemId]/decision/route.ts`, `lib/status/capabilities.ts`,
  `components/site/StatusPill.tsx`, `tests/review-decision-db.test.ts`, `tests/capability-status.test.ts`.
- Changed: `lib/repositories/shield-audit-repository.ts` (transactional insert), `lib/workflow/review-queue.ts`
  (optional durable write), `lib/types.ts` (`version`, `originalContent`), `app/api/review-cases/[id]/route.ts`
  (guards), `lib/use-review-cases.ts` (`decideItem`), `components/gp/gp-dashboard.tsx` (server decisions, signed-in
  identity, error shown), `components/site/vision.ts`, `Pillars.tsx`, `DiabetesAreas.tsx`, `app/site.css`,
  `e2e/platform-golden-hitl.spec.ts`, `e2e/marketing.spec.ts`, `package.json`.
- No database migration (version lives in the case payload).

## 4. Tests run (17 Oct, local; CI blocked by billing)

- `test:clinical-proof` (full, includes DB suites on simulation): pass.
- `tests/review-decision-db.test.ts`: validation, transitions, edit keeps original, server identity; stored decision,
  audit in the same transaction, stale version refused, audit failure rolls back: pass.
- `tests/capability-status.test.ts`: 18 capabilities, every claim backed by existing evidence: pass.
- e2e (simulation build): marketing 17 passed; golden HITL accept/reject/edit, clinical-proof HITL, Patel, GP dashboard
  and accessibility: 30 passed in total across runs.
- Route smoke: pass. Production link crawl: no broken links.

## 5. Known limitations

- Case-level transitions on the other review screens (case detail, ops dashboards, meeting packet) still save through
  the generic route. They can no longer change item decisions and are version-checked, but their case-level audit
  entries are still client-authored. Next increment: move case accept / finalise to a server endpoint.
- The voice-transcript edit on the GP screen still saves through the generic route (content only, not a decision).
- Accept → FHIR staging runs on case-level accept via the generic route; its result is returned but staging failures
  are logged rather than surfaced to the reviewer.

## 6. Release checklist (this increment)

- [x] Typecheck clean; full suite and affected e2e pass locally.
- [x] No change to production-reachable APIs (review cases are closed in the real workspace).
- [ ] CI green on GitHub (blocked: billing).
- [x] Production smoke after deploy (pages, health, closed APIs).

## 7. Rollback

Revert the merge commit on `main` (`git revert -m 1 <merge>`), push, and Vercel redeploys the previous build. No data
migration to undo; cases saved with a `version` field remain readable by the previous code (the field is ignored).
