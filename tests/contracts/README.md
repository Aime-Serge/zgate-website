# Website contract tests

Prove the website works with the contract the **e-learning platform** owns, `@zgate/elearning-contracts`:

| Test                      | What it proves                                                                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/enrollLink.test.tsx` | The real course page component (`CourseView`) renders an Enroll link that follows the enroll-link format                                                                       |
| `src/courseSlug.test.ts`  | The CMS accepts exactly the course slugs the contract accepts. Catalog consumption is a Vitest `todo` (never reported as passed) until the API serves `/api/v1/public/catalog` |

The e-learning package is installed from `vendor/elearning-contracts`, a checksummed snapshot of the e-learning repository's version, as a `file:` dependency (a copy, with its own dependencies). To test against a newer version, run `node scripts/sync-contracts.mjs --from <e-learning checkout>`, then `pnpm install` (`vendor/README.md`).

They run in this repository's CI. When the e-learning contract changes, the e-learning team syncs it here in a pull request, so these tests run against it before the website relies on it.
