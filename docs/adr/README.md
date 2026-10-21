# Architecture Decision Records

The decisions that shape this repository, and why. An accepted ADR is not rewritten: a later ADR amends or supersedes it.

| ADR                                             | Decision                                                                                           | Status                                                  |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| [004](ADR-004-data-residency-hosting-region.md) | Where personal data is hosted (Rwanda by default)                                                  | **Open**: needs the Managing Director and legal counsel |
| [007](ADR-007-separate-product-backends.md)     | The website and the e-learning platform are separate products with separate backends and databases | Accepted                                                |
| [008](ADR-008-self-contained-products.md)       | Each product holds everything it needs to build, run and deploy                                    | Accepted, partly superseded by 009 and 010              |
| [009](ADR-009-independent-workspaces.md)        | Independent workspaces; each contract is owned by its provider                                     | Accepted, partly superseded by 010                      |
| [010](ADR-010-separate-repositories.md)         | One repository per product; contracts consumed as checksummed snapshots                            | Accepted                                                |
| [011](ADR-011-website-release-gate.md)          | The website's release gate while courses collect a waitlist                                        | Accepted                                                |
| [012](ADR-012-django-wagtail-cms.md)            | The CMS is Django + Wagtail, headless, with a standard Django layout                               | Accepted                                                |
| [013](ADR-013-independent-hosting.md)           | The public site and the CMS are hosted and released independently, over HTTPS                      | Accepted; amends 011's release gate                     |

**Numbering gaps are deliberate.** ADR-001 (modular monolith), 002 (shared client record), 003 (TypeScript everywhere), 005 (self-hosted authentication) and 006 (no EBM billing integration) concern the e-learning platform and the wider company systems. They live in the e-learning repository and in this repository's history (tag `monorepo-final`).

**Paths in older ADRs** (before 2026-10-19) are the monorepo's: read `website/X` as `X` here, and `elearning/X`, `legacy/ops`, `shared/` or `platform/` as the e-learning repository (ADR-010 §7).
