# HSI research integration

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

Local checks need no database credentials. Google Fonts fetches are blocked by the current cloud proxy (HTTP 403); development uses fallback fonts. Required font domains are `fonts.googleapis.com` and `fonts.gstatic.com`; production build verification remains pending until access is available. No production deployment or clinical integration is claimed.
