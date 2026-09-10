# Z-GATE Digital Platform — Responsive Rules

Mobile-first is not a preference on this project — it's a direct response to a sourced market fact repeated across three prior phases: Rwanda's internet penetration is 34.2% against 88.7% mobile connectivity (`docs/business/BUSINESS_ALIGNMENT.md`, citing the Business Plan's market research), and every external-facing persona in `docs/ux/UX_RESEARCH.md` is mobile-primary. This document makes that finding concrete and binding.

## Methodology

- **Design and build for `sm` (< 640px) first.** Every component in `COMPONENT_SPECIFICATION.md` must work correctly at 320px width before any larger-breakpoint treatment is added.
- **Breakpoints add capability, never remove it.** A feature usable on mobile must remain fully usable at every larger breakpoint — layout may reflow, but no functionality is mobile-exclusive or desktop-exclusive without a specific, documented reason.
- **Content and hierarchy stay constant across breakpoints** — what changes is layout (columns, navigation pattern), not what information is shown or omitted. Hiding real information on mobile (e.g., hiding a compliance deadline "to save space") would directly contradict the platform's own vision (`docs/product/PRODUCT_VISION.md`: "make Advisory's compliance work provably reliable").

## Breakpoint behavior by surface

### Public website
| Breakpoint | Layout |
|---|---|
| `sm` | Single column, stacked division cards, hamburger/drawer navigation |
| `md` | Two-column division grid where relevant (matches the brand guide's own `division-logo-grid` 2-column tablet behavior) |
| `lg`+ | Four-column division grid (matches the brand guide's 4-column desktop grid), horizontal top navigation |

### Client Portal
| Breakpoint | Layout |
|---|---|
| `sm` | Single-column stacked cards (status card first, deliverables list below) — this is the primary, most-used configuration for this surface given the Solange persona's mobile-only usage pattern |
| `md`+ | Same content, wider margins — no meaningful layout change is needed; this surface is intentionally simple enough that a desktop-specific layout adds no value |

### Staff Portal
| Breakpoint | Layout |
|---|---|
| `sm` | Table views collapse to stacked cards (one card per client/lead); navigation becomes a bottom tab bar or drawer |
| `md`+ | Full table layout with sidebar navigation — the Advisory Associate's "client-facing" role (per the HR job description) means both contexts genuinely matter, not just desktop |

### Admin Platform
| Breakpoint | Layout |
|---|---|
| `sm` | Functional but not the primary design target — admin tasks (user management) are lower-frequency and more likely performed at a desk; still must meet the same touch-target and readability minimums |
| `md`+ | Full sidebar + content layout |

## Touch targets

- **Minimum 44×44px** for any interactive element on any surface reachable by touch (i.e., every surface — desktop-only interactions are not assumed anywhere in this platform, since even Staff Portal users are "client-facing" and may use mobile).
- **Minimum 8px spacing** between adjacent touch targets to prevent mis-taps — directly relevant for table-row actions and form controls on `sm`.

## Performance budget (ties directly to `docs/design/DESIGN_SYSTEM.md` and the mobile-first principle)

- Public website pages should be usable on a throttled/slow mobile connection — this governs implementation choices (image weight, font-loading strategy) more than it governs this design document directly, but the design system must not *require* heavy assets to render correctly (e.g., no full-bleed video backgrounds, no large unoptimized hero imagery as a default pattern).
- Loading states (`COMPONENT_SPECIFICATION.md`) exist specifically because real users on real Rwandan mobile connections will see them regularly — they are not an edge case.

## Orientation & viewport

- Portrait is the default assumption for all mobile layouts; landscape should not break (no fixed-height mobile layouts that clip content), but no landscape-specific layout is designed separately — not a documented need in any persona's usage pattern.
- No fixed viewport-height-dependent layouts (e.g., "100vh hero") without accounting for mobile browser chrome (address bar) eating into that height — a common real-world bug this rule exists to prevent.

## What this document does not do

It does not specify exact pixel breakpoints for individual components beyond what's already in `DESIGN_SYSTEM.md`'s breakpoint table, and it does not mandate a specific CSS methodology (media queries vs. container queries, a specific framework's grid system) — that's an implementation decision for the architecture/frontend phase.
