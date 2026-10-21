# @zgate/website-contracts

What the Z-GATE website sends to other systems. Owned by the website; the e-learning repository checks itself against a snapshot of it (in that repository's `vendor/`) in its contract tests.

| Export                                                        | What it is                                                                                                              |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `leadFormSchema`, `attributionSchema`, `fieldErrorsFrom`      | The public lead form (contact enquiry, course waitlist): fields, validation, first-touch attribution                    |
| `LEAD_INTAKE_PATH`, `LeadIntakeRequest`, `LeadIntakeResponse` | How a validated submission is handed to the CMS and answered                                                            |
| `leadWebhookPayloadSchema`, `LEAD_WEBHOOK_EVENT`              | The lead/waitlist webhook payload for systems outside the website, first the e-learning CRM. **Defined, not sent yet.** |
| `@zgate/website-contracts/constants`                          | `INTERESTS`, `ATTRIBUTION_FIELDS`, `LeadFormState`: no dependencies, safe in client components                          |

## Rules

- Schemas and types only, no I/O. Imports no app and no other workspace package (`pnpm lint:boundaries`).
- **No breaking changes in place.** Removing or renaming a field, or narrowing a type, breaks consumers. `compat/compat.test.ts` fails on such a change against `compat/published.json`, the agreed contract baseline.
- After a change here merges, sync it into the e-learning repository (`node scripts/sync-contracts.mjs --from <website checkout>` there) and run its contract tests in that pull request (docs/DEVELOPER_GUIDE.md, "Contracts").

## Changing the contract

- **Additive change** (new optional field, wider type): change the schema; the compat test still passes. Then refresh the baseline with `pnpm --filter @zgate/website-contracts compat:update` in the same pull request.
- **Breaking change**: add the new shape next to the old one, move every consumer over, and only then remove the old one, refreshing the baseline in that last pull request with the e-learning team's review.
