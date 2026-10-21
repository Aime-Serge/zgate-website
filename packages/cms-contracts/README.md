# @zgate/cms-contracts

What the public site (`frontend/`) may use from the CMS (`backend/`, Django + Wagtail):

| Module                    | What it is                                                                                                                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `content-types.ts`        | Types for the CMS's JSON API (pages and their blocks, divisions, courses, articles, redirects, site settings). Written by hand to match `backend/content/serializers.py`: rename a field in both |
| `divisions.ts`, `slug.ts` | The four division slugs and the slug rule the CMS enforces                                                                                                                                       |
| `webhook.ts`              | Signing and verifying the CMS's "content changed" webhook                                                                                                                                        |
| (re-exported)             | The lead form and lead intake from `@zgate/website-contracts`                                                                                                                                    |

Internal to the website: no other product uses it. The frontend imports this package, never the CMS (a Python app it reaches over HTTP).
