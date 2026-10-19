# vendor/

A snapshot of the contract package the **e-learning repository** owns and this repository is checked against (README.md, "Contracts"):

| Folder                 | Package                      | Used by                                |
| ---------------------- | ---------------------------- | -------------------------------------- |
| `elearning-contracts/` | `@zgate/elearning-contracts` | `tests/contracts` (as a `file:` dependency) |

**Never edit these files.** They change only through the sync script, which copies the e-learning repository's committed version and records its commit, tree id and checksum in `VENDORED.json`:

```bash
node scripts/sync-contracts.mjs --from ../elearning   # path to an e-learning checkout
pnpm install                                          # picks up the new copy
pnpm --filter @zgate/website-contract-tests test
```

CI runs `node scripts/sync-contracts.mjs --check`, which fails if anything here differs from the recorded checksum.

The first snapshot (2026-10-19) was taken in the z-gate monorepo before the split (ADR-010); its `commit` is the monorepo's (tag `monorepo-final`). The `tree` id is unchanged by the split, so `git rev-parse <commit>:packages/elearning-contracts` in the e-learning repository finds the same content.
