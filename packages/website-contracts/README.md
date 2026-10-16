# @zgate/website-contracts

What the Z-GATE website sends to other systems. Owned by the website; the e-learning platform links it (by path) in its contract tests, `elearning/tests/contracts`.

| Export                                                        | What it is                                                                                                              |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `leadFormSchema`, `attributionSchema`, `fieldErrorsFrom`      | The public lead form (contact enquiry, course waitlist): fields, validation, first-touch attribution                    |
| `LEAD_INTAKE_PATH`, `LeadIntakeRequest`, `LeadIntakeResponse` | How a validated submission is handed to the CMS and answered                                                            |
| `leadWebhookPayloadSchema`, `LEAD_WEBHOOK_EVENT`              | The lead/waitlist webhook payload for systems outside the website, first the e-learning CRM. **Defined, not sent yet.** |
| `@zgate/website-contracts/constants`                          | `INTERESTS`, `ATTRIBUTION_FIELDS`, `LeadFormState`: no dependencies, safe in client components                          |

## Rules

- Schemas and types only, no I/O. Imports no app and no other workspace package (`pnpm lint:boundaries`).
- **No breaking changes in place.** Removing or renaming a field, or narrowing a type, breaks consumers. `compat/compat.test.ts` fails on such a change against `compat/published.json`, the agreed contract baseline.
- A pull request that changes this package also runs the e-learning platform's contract tests (`.github/workflows/website.yml`, job "Consumer contracts").

## Changing the contract

- **Additive change** (new optional field, wider type): change the schema; the compat test still passes. Then refresh the baseline with `pnpm --filter @zgate/website-contracts compat:update` in the same pull request.
- **Breaking change**: add the new shape next to the old one, move every consumer over, and only then remove the old one, refreshing the baseline in that last pull request with the e-learning team's review.
