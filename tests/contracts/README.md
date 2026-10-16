# Website contract tests

Prove the website works with the contract the **e-learning platform** owns, `@zgate/elearning-contracts`:

| Test                      | What it proves                                                                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/enrollLink.test.tsx` | The real course page component (`CourseView`) renders an Enroll link that follows the enroll-link format                                                                       |
| `src/courseSlug.test.ts`  | The CMS accepts exactly the course slugs the contract accepts. Catalog consumption is a Vitest `todo` (never reported as passed) until the API serves `/api/v1/public/catalog` |

The e-learning package is installed as a `file:` dependency (a copy, with its own dependencies), so this workspace installs on its own. After changing it locally, run `pnpm install` here to pick the change up; CI always installs fresh.

They run in website CI and, whenever a pull request changes `elearning/packages/elearning-contracts`, in e-learning CI too ("Consumer contracts").
