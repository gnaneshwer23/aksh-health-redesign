# Launch readiness — Aksh Health UK

**Status:** Honest checklist for facilitators and ops.  
**Not clinical production ready.** Completing Milestones A–E does **not** certify clinical use, flip `productionRbacEnforced`, or enable live EPS / EHR / PACS.

**Shipped (engineering):** Milestone A–E · HCP eval harness · C1–C5 · D1 dual-path ops · E1 / E-P1 correlation · marketing landing (#113).  
**Still deferred:** `productionRbacEnforced: false` · live EPS/EHR/PACS · PRISM/ATLAS scaffolds only · lab/pharmacy **sim** (not live) · no clinical validation · no human calendar / CSO exit-note product · Vercel OOM / HSI E2E tip noise may exist (treat GH unit gates as the merge bar when preview is historically flaky).

---

## Must-have before any **external demo** launch

Software / product honesty for a stakeholder walkthrough (GP / nurse / pharmacy / lab / admin):

| Gate | Why |
| --- | --- |
| Synthetic demo cohort seeded (`npm run seed:demo-cohort -- --apply`) | Populated worklists across roles — empty accounts kill demos |
| Documented logins + `DEMO_SEED_PASSWORD` / `DEMO_COHORT_PASSWORD` (never in git) | Facilitators can switch personas |
| Honesty banners: `liveEmis:false` · `ehrWrite:false` · lab/pharmacy sim · Agent Ops demo-cohort note | Buyers must not hear “live NHS write” |
| `productionRbacEnforced` remains **false** (do not flip for demos) | Avoid claiming production RBAC |
| Marketing / landing honesty (no live EMR claim; no overstated cohort on homepage) | Trust |
| Demo script path (`/demo/script` or facilitator session C1) practiced once | Room time |
| Purge path known (`npm run purge:demo-cohort -- --apply`) | Removable before any “real data” cutover |

Ops (demo host):

| Gate | Why |
| --- | --- |
| Simulation Neon / env (`deployment_marker=simulation`) for seed/purge | Seed scripts refuse production DBs |
| Smoke of GP + nurse + pharmacist + lab (`lab01@…` → lab-queue) + front-desk | Prove role worklists load |
| Secrets only in host env (no Partner / IM1 required for synthetic demo) | See `DEMO_LAUNCH_WITHOUT_IM1.md` |

Clinical / legal (demo):

| Gate | Why |
| --- | --- |
| Explicit verbal + UI: **synthetic / not clinical validation** | Liability / MHRA framing |
| No real patient PHI in the demo tenant | DPIA / confidentiality |

---

## Must-have before **clinical production** launch

**Do not claim this bar is met today.**

Software:

| Gate | Status |
| --- | --- |
| Governed flip of `productionRbacEnforced` with denial proofs | Deferred |
| Live EPS / prescribing path with safety case | Not built (sim only) |
| Live EHR / EMIS / SystmOne write-back (not BRIDGE staging) | Not built (`ehrWrite:false`) |
| Live pathology / PACS connectors | Not built |
| PRISM / ATLAS beyond scaffolds | Deferred |
| Lab / pharmacy beyond HITL sim | Deferred |
| Clinical validation / HCP-signed evidence pack | Not done (harness ≠ validation) |
| Human calendar + CSO exit-note product | Deferred |
| Stable production CI / hosting (resolve Vercel OOM / flaky HSI E2E if still on tip) | Ops follow-up |

Ops / clinical / legal:

| Gate | Status |
| --- | --- |
| CSO / clinical safety case · DCB0129/0160 as applicable | Required — not signed here |
| DPIA · DSPT / cyber · contract + DPA with practices | Required |
| CIS2 / NHS Identity (or agreed auth) for staff | Not demo signup |
| Real org tenancy cutover; **purge demo cohort first** | `purge:demo-cohort` |
| On-call / incident / support runbooks | Required |
| Monitoring / SLOs for clinical surfaces | Deferred eng |

---

## Nice-to-have

- Neo4j graph seed (`seed:demo-cohort -- --apply --with-neo4j`) for precision-health demos  
- HCP eval case pack refresh + facilitator calendar polish  
- Broader PHI scrub beyond C4  
- Population / ICS views reconciled with the individual demo cohort  
- Multi-market synthetic world (separate from UK demo cohort) for global narrative  

---

## Demo vs production — one-liners

| Question | Answer |
| --- | --- |
| Ready for external **synthetic** stakeholder demo? | **Conditionally yes** after Must-demo gates (seed + honesty + practiced script). |
| Ready for **clinical production**? | **No.** |

See also: [`DEMO_COHORT_SEED.md`](../DEMO_COHORT_SEED.md) · [`DEMO_LAUNCH_CREDENTIALS.md`](../DEMO_LAUNCH_CREDENTIALS.md) · milestone honesty docs under `docs/milestone-*`.
