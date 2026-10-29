# ADR-DIAB-001 — Package ownership; no merge/delete without approval

**Status:** Accepted (engineering policy)  
**Date:** 29 October 2026  
**Deciders:** Product engineering (requires **explicit user approval** before any package delete/merge)

## Context

The monorepo contains multiple packages with different deploy and product boundaries. `packages/platform-uk` is the live UK site. `packages/aksh-health` is legacy. Consolidating packages looks attractive for “cleanup” but risks breaking deploy roots, Vercel settings, docs, and historical evidence.

## Decision

1. **Do not delete or merge packages** (`aksh-health`, `foundation`, India packages, `akeno`, etc.) without:
   - A written ADR update in this folder (or `packages/platform-uk/docs/`), **and**
   - An explicit note that **user approval is required**, **and**
   - User approval recorded before the merge PR lands.
2. **Diabetes Connected Intelligence** ships only by **extending `packages/platform-uk`** (and optionally consuming `foundation` types).
3. Propose-only for consolidation: engineers may draft a migration plan; they may not execute package removal as drive-by cleanup.

## Migration plan (propose only — needs approval)

| Step | Action | Approval gate |
|------|--------|---------------|
| A | Inventory all imports of `aksh-health` and dead deploy targets | None (read-only) |
| B | Redirect docs/bookmarks to platform-uk | Optional |
| C | Archive `aksh-health` to read-only (rename or `packages/_archive/`) | **User approval** |
| D | Extract shared UI tokens to `foundation` if duplicated | **User approval** if moving public APIs |
| E | Delete archived package after one release cycle | **User approval** |

Until A–E are approved, leave packages in place.

## Consequences

- Slightly larger monorepo; clearer blast radius.
- No accidental loss of legacy marketing or India/Akeno surfaces.
- Diabetes work remains reviewable as additive PRs to `platform-uk`.
