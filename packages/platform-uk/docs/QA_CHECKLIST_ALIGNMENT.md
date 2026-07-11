# QA Checklist Alignment — Phase E

This document maps the **Aksh Health Deployment QA Checklist** (~188 checks across 15 sections) to automated coverage in this repo. It also records corrections where the original spreadsheet still references superseded architecture.

**Source checklist:** `Aksh_Health_Deployment_QA_Checklist.xlsx` (Desktop `akshhealth 2031/`)

**Production URL:** https://0ne-health.vercel.app  
**Repo:** `packages/platform-uk` in `0ne-Health` monorepo

---

## Architecture corrections (checklist vs current build)

| Checklist assumption | Current implementation |
|---|---|
| Supabase Auth / JWT refresh (S11-01) | **NextAuth.js** credentials + optional clinical OAuth; session via `next-auth` cookie |
| Supabase Postgres (S1-03, S11-02) | **Neon Postgres** via `pg` + `lib/auth/user-repository.ts` (optional; demo users work without DB) |
| `SUPABASE_SERVICE_ROLE_KEY` in bundle (S11-02) | **N/A** — no Supabase; verify no `NEO4J_PASSWORD` / `NEXTAUTH_SECRET` in client bundle instead |
| Signup role **dropdown** (S2-01) | **8-tile role picker** on `/signup` (`RoleTile` grid) |
| Email confirmation after signup (S2-02) | Account created → auto sign-in → redirect to `/onboarding/role-select` (no email gate in demo) |
| Test account `test-gp@example.com` (S15-02) | Demo GP: `gp@demo.akshhealth.com` / `demo123` |

---

## Automation layers

| Layer | Command | Scope |
|---|---|---|
| **Unit / contract** | `npm run verify` | Workflow scenarios, API contracts, Phase D API, route smoke |
| **HTTP smoke (role dashboards)** | `npm run smoke:all` | All 8 role dashboards via NextAuth API + HTML assertions |
| **HTTP smoke (public)** | `npm run smoke:public` | Marketing / public routes |
| **HTTP smoke (walkthrough)** | `npm run smoke:walkthrough` | Authenticated review / demo paths |
| **Playwright E2E** | `npm run test:e2e` | Browser journeys (this Phase E suite) |
| **Playwright UI mode** | `npm run test:e2e:ui` | Interactive debugging |

### Running E2E locally

```bash
cd packages/platform-uk
npm run dev          # terminal 1 — or let Playwright start dev server automatically
npm run test:e2e     # terminal 2
```

Override target:

```bash
E2E_BASE_URL=http://127.0.0.1:3000 npm run test:e2e
```

CI runs `npm run verify && npm run build` then Playwright against `npm run start` (see `.github/workflows/e2e.yml`).

---

## Section mapping (checklist → automation)

| Section | Checks | Automated (E2E) | Automated (smoke / verify) | Manual |
|---|---:|---|---|---|
| **S1 Pre-Deploy Infrastructure** | 12 | — | Partial (`verify`, Vercel deploy) | Vercel project hygiene, env vars, domain |
| **S2 Authentication & Signup** | 16 | `e2e/auth.spec.ts` (8-tile picker, GP sign-in) | `smoke:gp` sign-in | OAuth SSO, password reset, email flows |
| **S3 Onboarding Flow** | 19 | `e2e/onboarding-redirect.spec.ts` | — | Step-by-step identity/GMC/consent fields |
| **S4 Marketing Landing Pages** | 14 | `e2e/marketing.spec.ts` | `smoke:public` | Lighthouse, load timing, all audience pages |
| **S5 GP Dashboard** | 23 | `e2e/gp-dashboard.spec.ts` | `smoke:gp` (6 routes) | Patient panel data fidelity, HITL actions |
| **S6 Other Dashboards** | 16 | — | `smoke:all` (nurse, pharmacist, admin, patient, ics, hospital, researcher) | Per-role form interactions |
| **S7 AI Review Queue (HITL)** | 11 | — | Partial (`verify` workflow tests) | Accept/Edit/Reject, draft-only writes |
| **S8 Neo4j Data Layer** | 10 | `e2e/api-health.spec.ts` | `phase-d-api.test.ts` | Live Aura patient queries, seed data |
| **S9 Demo & Presenter Flow** | 7 | — | `smoke:walkthrough` | Patel walkthrough, voice care day |
| **S10 Mobile & Responsive** | 7 | `e2e/patient-dashboard.spec.ts` (mobile project) | — | GP iPad layout, homepage hamburger |
| **S11 Security & Compliance** | 12 | `e2e/role-routing.spec.ts`, `e2e/api-health.spec.ts` (401) | Route contracts | Bundle secret scan, RBAC matrix, CSRF |
| **S12 Performance & Monitoring** | 7 | — | — | Lighthouse, Core Web Vitals, monitoring |
| **S13 Accessibility (WCAG 2.1)** | 8 | — | — | Keyboard nav, focus rings, screen reader |
| **S14 Clinical Safety Gates** | 13 | — | `verify` safety workflow tests | DCB0129 labelling audit, consent banners |
| **S15 Post-Deploy Smoke** | 13 | E2E suite (subset) | `smoke:all`, `smoke:public` | Production URL sign-off after deploy |

---

## E2E test file index

| File | Journey | Checklist anchors |
|---|---|---|
| `e2e/marketing.spec.ts` | Homepage, nav, get started CTA visibility | S4-01, S4-02, S15-01 |
| `e2e/auth.spec.ts` | 8-tile signup, GP credentials sign-in | S2-01, S2-03, S15-02 |
| `e2e/onboarding-redirect.spec.ts` | Incomplete onboarding → `/onboarding/*` | S3-01, S3-02 |
| `e2e/gp-dashboard.spec.ts` | GP dashboard + sidebar nav | S5-01, S5-03 |
| `e2e/patient-dashboard.spec.ts` | Patient mobile tabs | S6-08, S10-01 |
| `e2e/api-health.spec.ts` | `/api/neo4j/health`, `/api/profile` shapes + 401 | S8-01, S8-02, Phase D |
| `e2e/role-routing.spec.ts` | Unauthenticated `/dashboard/*` → signin | S11-03, S15-03 |
| `e2e/helpers/auth.ts` | Shared NextAuth sign-in helpers | — |

**Demo accounts** (password `demo123`): see `lib/auth/demo-users.ts`.  
Onboarding-only test user: `onboarding@demo.akshhealth.com`.

---

## Coverage summary

- **~188 checklist items** are not duplicated 1:1 in automation (by design).
- **Phase E adds 8 Playwright specs** covering representative critical paths across auth, onboarding, marketing, GP/patient dashboards, API health, and route protection.
- **`npm run smoke:all`** continues to cover all 8 role dashboards via HTTP (S6, S15).
- **`npm run verify`** covers workflow/API contracts (S7, S8 partial, S14 partial).
- **Remaining manual:** infrastructure sign-off, performance/Lighthouse, accessibility, clinical safety walkthroughs, production deploy verification, and detailed HITL interaction testing.

---

## CI

GitHub Actions workflow: `.github/workflows/e2e.yml`

Triggers on `packages/platform-uk/**` changes. Steps: `npm ci` → `npm run verify` → `npm run build` → Playwright (Chromium + mobile patient test).
