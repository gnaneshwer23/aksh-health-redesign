# HSI research integration

## RA evidence import foundation

The pinned shared `raEvidenceRelease.ts` validator is available for the next
research corpus integration. It checks source identities, passage hashes,
attribution and article-level licence declarations. Dossier Markdown retains
article and licence links. This code does not register a verified RA corpus or
claim a completed context benchmark: source import remains pending, and scientific
support stays unassessed. See the
[implementation status](https://github.com/gnaneshwer23/hsi-core/blob/main/docs/RA_ANTI_TNF_EVIDENCE_RELEASE.md).


## Authenticated backend and internal workflow

The investigation runner now has an authenticated product API, private PostgreSQL
checkpoints, audit rows, RLS, revision checks, quotas and an internal UI at
`/internal-research`. No public landing-page link is added. Source passages are
absent until a rights-verified release is supplied; the UI reports that gap and
does not invent scientific support.

See the [activation instructions and verification limits](https://github.com/gnaneshwer23/hsi-core/blob/main/docs/INVESTIGATION_PRODUCT_BACKENDS.md).
The new migration must run on this product's database before the workflow is
available. Missing configuration fails closed; there is no file/sample fallback.


## Shared investigation service

`investigationService.ts` is the canonical HSI server-side runner, with Git and
SHA-256 provenance. Its consumer test executes corpus retrieval → graph context →
explicit counterevidence → unvalidated research questions → human review → dossier
using the same contract fixture. The Node-only module must stay in backend code.

It requires an authorisation adapter on every action and a store with atomic
revision checks. The memory store in conformance tests is intentionally local;
the shared library alone does not establish a live deployment, literature API
or model connection.
Product backend/storage adapters are implemented above; live activation still
requires the product migration and account provisioning. No public page is added. See the
[execution and recovery semantics](https://github.com/gnaneshwer23/hsi-core/blob/main/docs/INVESTIGATION_SERVICE.md).


## Shared research contracts

`researchContracts.ts` beside the shared algorithm is an exact HSI source snapshot,
with Git revision and SHA-256 provenance. It defines versioned research context,
source/passages, existing graph relationships, claim assessments, human review
and run history. The new consumer conformance test validates an abstract synthetic
fixture and rejects unsafe or inconsistent envelopes. No public UI is added.

This supplies the common boundary for the investigation service above. The validator does not
itself call a provider or move product data. The product backend authenticates reviewers and persists execution history and
digests. Operators must exclude PHI and verify source rights. Structural approval metadata is not an
authorisation check. See HSI's
[contract semantics and limits](https://github.com/gnaneshwer23/hsi-core/blob/main/docs/SHARED_RESEARCH_CONTRACT.md).
The older research snapshot contract below serves its existing exchange and is
not silently replaced by this new investigation contract.


## Shared executable technology

Aksh's existing dashboard `sortReviewQueueItems` delegates to HSI's canonical
human-review prioritisation algorithm. It preserves urgent GUARDIAN → priority →
recency ordering. The module executes inside Aksh; records and object references
remain in the app's own process. It makes no clinical or approval decision.

The exact source and HSI Git/SHA-256 provenance live under
`packages/platform-uk/lib/hsi/sharedTechnology*`. The consumer test verifies source
integrity and unchanged ordering/record ownership, and runs in the HSI consumer
CI workflow. Edit the canonical HSI source and regenerate the snapshot; a future
versioned private package can replace this transitional distribution method.

This executable reuse is separate from the pre-existing read-only research
snapshot below. No database, credential, patient record or EHR action is shared.

The active UK app now consumes a versioned, public, read-only HSI research snapshot at `packages/platform-uk/app/hsi/page.tsx`. The entry point is linked from `/resources`; no patient identifiers, observation values, clinical decisions or database connections cross this boundary.

Producer: `gnaneshwer23/hsi-core`, `src/cli/export-aksh-research.ts`.
Consumer schema: `packages/platform-uk/lib/hsi/research-contract.ts` (`hsi-aksh-research-1`).
Imported artifact: `packages/platform-uk/data/hsi/research-bundle.json`.
Capability: `hsi_research_context`, `in_validation`.

With Bun installed, from `packages/platform-uk`:

```bash
bun scripts/sync-hsi-research.ts /path/to/hsi-core/dist/hsi-aksh-research.json
bun tests/hsi-research-contract.test.ts
bun tests/capability-status.test.ts
./node_modules/.bin/tsc --noEmit --incremental false
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Invalid artifacts fail validation before replacement; repeat imports are idempotent. The view validates again at render time. A source identifier or mapping never implies claim support, patient-specific applicability or clinical approval. Known source limitations are displayed rather than discarded.

The complete producer/consumer architecture, local commands and release gates are documented in the HSI repository at `docs/AKSH_PLATFORM_INTEGRATION.md`. HSI sets `VITE_AKSH_APP_URL` to this app's origin to enable its shared research context link. Do not point that link at a production release until `/hsi` is deployed there.

Local checks need no database credentials. The full production build now passes with integrity-pinned, self-hosted Fontsource fonts; Google font downloads are no longer required. OFL licence copies live under `/legal/fonts/`. Imports reject stale/conflicting snapshots and dirty producer revisions by default, use an exclusive writer lock, and preserve the current snapshot on failure. `--allow-local-changes` is an explicit local-development override, not a release approval. No production deployment or clinical integration is claimed.


## Delivery Phase F: product-owned source artifact acceptance

The RA rights-verified server loader now verifies the same `hsi-research-corpus-artifact-1` transfer as the other product, using a separately installed product-owned hash/commit/minimum-sequence policy. It refuses modified, incompatible or stale artifacts, and preserves unrelated local corpora. Source passages and graph anchors remain research context: **scientificReview=unreviewed; zero approved claims**. No HSI role, scientific decision or clinical applicability is transferred.

Run `bun --no-env-file run hsi:verify-artifact` from the application directory for actual-loader parity, source-provenance and unsafe-input checks. An optional `hsi:import-artifact PATH` uses the separately installed policy, an exclusive lock and atomic single-file replacement; it does not update the trust policy from the incoming file. Source/annotation legacy files remain for the existing annotation workflow. The active RA runtime uses `data/hsi/ra-anti-tnf/transfer.json` (under `src/` in ISI).

Current trust mode is **pinned_digest**, not a signed-release claim. Required-signature mode exists in the canonical verifier but needs operator-provisioned Ed25519 public-key policy and an independently signed artifact. No production keys, signatures, database migrations or grants were created. Details and live gates: [HSI Phase F](https://github.com/gnaneshwer23/hsi-core/blob/main/docs/PHASE_F_PRODUCT_ACCEPTANCE.md).
