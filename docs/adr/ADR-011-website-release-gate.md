# ADR-011: Website Release Gate While the E-learning Platform Is Parked

**Status:** Accepted (2026-10-19)
**Builds on:** ADR-007 (separate products; course buttons open a waitlist until the LMS launches) and ADR-010 (separate repositories). It amends the release rule in ADR-009 §4 and ADR-010 for the period described below.

## Context

The rule so far: no production deploy of either product unless the customer journey (website course page → Enroll → LMS sign-up → payment → lesson → certificate → `/verify`) has passed against staging for the versions being deployed. The journey lives in the e-learning repository (`e2e/journeys`, `journey.yml`).

On 2026-10-19 leadership decided to develop the website alone first and resume the e-learning platform later. Until then there is no LMS to walk through: every journey step after the website's course page would stay `fixme`, so the gate would either block every website release or pass while proving nothing.

The website doesn't need the LMS to run. Course pages follow the CMS setting **Site settings > Academy > Enrollment mode**:

- **Waitlist** (the default): the course page shows a waitlist form; submissions land in the CMS lead inbox.
- **E-learning platform**: course buttons link to `{lmsBaseUrl}/courses/{slug}/enroll`, in the format the e-learning contract defines (`vendor/elearning-contracts`).

## Decision

1. **While the enrollment mode is Waitlist in every environment, the website's release gate is:**
   - this repository's CI is green for the commit, including "Website / Browser checks" (WCAG A/AA, CSP and public/CMS separation, the forms through lead intake, the JavaScript budget); and
   - the **website smoke check** has passed on staging with that commit deployed (`docs/WEBSITE_DEPLOY.md` §4): home page, one course page with its waitlist form, a waitlist submission arriving in the CMS lead inbox, the contact page, and the public host refusing `/admin` and `/api/revalidate`.
2. **The full customer-journey gate returns the day the enrollment mode is switched to E-learning platform on staging**, and it must pass there before the same switch is made in production. From then on, ADR-010's rule applies again to both products.
3. **Only an admin can switch the enrollment mode or set the platform address** (field-level access on `enrollmentMode` and `lmsBaseUrl`, tested in `backend/accounts/tests/test_roles.py` since ADR-012). A publisher's change to those fields is dropped. The switch is a release decision, not a content edit.
4. **The e-learning contract snapshot stays frozen** while the platform is parked. It is synced (`node scripts/sync-contracts.mjs --from <e-learning checkout>`) when e-learning work resumes, before the switch above.

## Consequences

- Website releases depend only on this repository and its staging environment.
- Nothing proves the enroll links work end to end until the switch. That is acceptable because no visitor sees an enroll link before it: in Waitlist mode the page renders no link to the platform.
- The gate relies on one CMS setting. Restricting it to admins (decision 3) keeps it from being flipped as a routine edit, and the CMS keeps its version history (`versions.drafts`) for audit.
- When the e-learning platform resumes, its first milestone that matters to the website is a staging environment the journey can run against.
