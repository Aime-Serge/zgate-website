# Z-GATE Digital Platform — Design System

**Source order:** existing brand assets (`zgate-brand-identity(1).html` — the approved Brand Identity Guide) → `docs/ux/` (Phase 3) → `docs/product/` (Phase 2) → `docs/marketing/` (Phase 4). **No Figma file or design-tooling integration exists in this repository or environment** (confirmed in `docs/discovery/UI_UX_AUDIT.md`) — this document is the design system of record until one is introduced, at which point tokens should sync *from* Figma, not be redefined here in parallel.

**What's extracted vs. new:** every color, font, and logo-system rule below marked **[BRAND GUIDE]** is taken verbatim from the approved guide. Everything marked **[NEW]** is this phase's own design work, filling a real gap — the brand guide is a marketing/brand book (business cards, letterhead, social avatars), not a product interface system, so spacing, grid, breakpoints, elevation, component states, and a light-surface mode for data-dense product screens don't exist in it yet. New tokens never override or contradict a brand guide token; they extend the same system into contexts the guide doesn't cover.

## Principles → design implications

| Principle (from the operating brief) | What it actually changes in this system |
|---|---|
| Professional / trustworthy | High-contrast, accurate data display over decoration; brand's own "Precision over polish" value governs every component's default state |
| Modern | Space Grotesk display type, restrained hairline borders, no skeuomorphism — matches the brand guide's existing aesthetic |
| Clear | One accent color per context, never competing; generous whitespace; short line lengths for body text |
| Accessible | See `ACCESSIBILITY_SPECIFICATION.md` — contrast, semantics, and keyboard support are binding, not aspirational |
| Mobile-first | Every component is specified mobile-first; breakpoints add capability, never remove it (see `RESPONSIVE_RULES.md`) — directly answers the UX research finding that 88.7% of the market is mobile-connected against only 34.2% internet penetration |
| Internationally credible | No visual signal that reads as "unfinished" or "informal" — consistent, deliberate token use throughout, same standard a Big-4-adjacent positioning (per `docs/marketing/POSITIONING.md`) requires |
| Appropriate for Rwanda/Africa | Not a stock "global SaaS" template — the Gate Mark, division colors, and Kinyarwanda/French readiness (see `ACCESSIBILITY_SPECIFICATION.md`) keep the system specific to its actual market, not generic |
| Commercially effective | Every page spec (`PAGE_SPECIFICATIONS.md`) carries the Audience/Problem/Promise/Proof/Objection/CTA structure `docs/marketing/MESSAGING_FRAMEWORK.md` already defined — design serves conversion, not just aesthetics |
| Clarity over decoration | No component in this system exists purely for visual effect — every element in `COMPONENT_SPECIFICATION.md` maps to a real information need from `docs/ux/UX_RESEARCH.md` |

## Color tokens

### Core [BRAND GUIDE, verbatim]

| Token | Hex | Use |
|---|---|---|
| `ink` | `#0B0F1A` | Primary dark surface / primary text on light surfaces |
| `ink-2` | `#131A2B` | Secondary dark surface |
| `paper` | `#ECEEF3` | Primary light surface / primary text on dark surfaces |
| `paper-dim` | `#B9BEC9` | Secondary text **on dark surfaces only** — see contrast table below, do not reuse on light surfaces |
| `gate-1` | `#5B6BFA` | Master-brand gradient start; reserved for master brand and thresholds |
| `gate-2` | `#34E0C9` | Master-brand gradient end; reserved for master brand and thresholds; already used semantically for "correct/yes" in the brand guide's own tone table |
| `advisory` | `#C9A15A` | Advisory division identity only |
| `academy` | `#3FAE7A` | Academy division identity only |
| `tech` | `#3F8CFA` | Tech division identity only |
| `data` | `#A85CF6` | Data division identity only |
| `line` | `rgba(236,238,243,0.14)` | Hairline dividers on dark surfaces |

**Binding rule carried from the brand guide:** "Each division owns exactly one current — never mixed into another division's material." This applies to product UI exactly as it applies to print: an Academy screen never borrows Advisory brass, even as a small accent.

### New tokens [NEW — needed for product UI, absent from the brand guide]

| Token | Hex | Why it's needed |
|---|---|---|
| `ink-secondary` | `#4B5468` | The brand guide's `paper-dim` is designed for dark surfaces only (10.3:1 contrast on `ink`) and fails badly on light surfaces (1.6:1 on `paper` — see contrast table). Product screens that are light-surface-primary (see "Light vs. dark surface" below) need a working secondary-text color; `ink-secondary` is computed for ≥ AA contrast on `paper`. |
| `line-light` | `rgba(11,15,26,0.12)` | Hairline dividers on light surfaces (the brand guide's `line` token is calibrated for dark surfaces and is nearly invisible on `paper`) |
| `warning` | `#E0A83A` | UI feedback state; deliberately distinct from `advisory` (#C9A15A) to avoid implying an Advisory-specific meaning on a non-Advisory screen |
| `success` | reuses `gate-2` `#34E0C9` | Already established semantically as "correct" in the brand guide's tone table — no new color introduced |
| `error` / `danger` | reuses `#E17575` | Already established semantically as "incorrect" in the brand guide's own usage examples — no new color introduced |
| `info` | reuses `gate-1` `#5B6BFA` | Extends the gate-gradient's indigo half to a UI-feedback role. **Flag for brand-owner confirmation:** the guide reserves the gradient for "master brand and thresholds only" — using the solid `gate-1` (not the gradient) for informational UI is a related but distinct use this document is proposing, not something the guide explicitly authorizes. |

### Light vs. dark surface — a design decision, not a brand-guide instruction

The brand guide is dark-surface-first throughout (it's a brand book: cover, business cards, letterhead mockups on `ink`). **This system uses `paper` as the primary surface for data-dense, daily-use product screens** (Client Portal, Staff Portal, Admin) and reserves the dark `ink` treatment for brand-forward, low-density surfaces (the public website's hero/marketing sections). This is a deliberate choice, not an extraction from the guide:

- **Why:** `docs/ux/EXPERIENCE_REQUIREMENTS.md` §4 requires legibility in bright/outdoor mobile use, and §1 prioritizes low-bandwidth clarity over visual richness — a light, high-contrast surface reads better for compliance-status checking on a phone in daylight than a dark brand-book aesthetic does.
- **What stays constant either way:** typography, the Gate Mark, division color assignments, spacing, and component anatomy are identical in both contexts — only the ink/paper role flips.

### Contrast reference (hand-computed via the WCAG relative-luminance formula; verify with an automated tool such as WebAIM's contrast checker before implementation sign-off)

| Pair | Approx. ratio | Passes |
|---|---|---|
| `ink` text on `paper` surface (or reverse) | ~16.5:1 | AAA, all text sizes |
| `paper-dim` text on `ink` surface | ~10.3:1 | AAA, all text sizes |
| `paper-dim` text on `paper` surface | ~1.6:1 | **Fails — do not use** |
| `ink-secondary` text on `paper` surface | ~6.5:1 | AA all sizes, near-AAA |
| Division color (e.g. `advisory`) as text on `ink` surface | ~8:1 | AAA |
| Division color (e.g. `advisory`) as text on `paper` surface | ~2:1 | **Fails — do not use as text on light surfaces; use as a background fill with dark text, a left-border accent, or an icon color only** |

**Working rule:** division colors and `warning`/`info`/`success`/`error` semantic colors are safe as *text* only on the `ink` surface. On the `paper` surface, use them as background fills (with `ink` text on top), left-border accents, dots, or icon strokes — never as small body text color.

## Typography [BRAND GUIDE font choices, NEW scale]

| Role | Font [BRAND GUIDE] | Use |
|---|---|---|
| Display | Space Grotesk (400/500/600/700) | Headlines, division names, the wordmark, page titles |
| Body | Inter (400/500/600/700) | Paragraphs, UI text, form labels, table content |
| Mono | IBM Plex Mono (400/500) | Labels, data tables, invoice/compliance line items, status codes |

### Type scale [NEW]

| Token | Size / line-height | Font | Use |
|---|---|---|---|
| `display-lg` | 40–52px / 1.1 | Space Grotesk 600 | Marketing hero headlines only |
| `display-md` | 28–32px / 1.2 | Space Grotesk 600 | Page titles (portal/admin) |
| `display-sm` | 20–22px / 1.3 | Space Grotesk 600 | Section headers, card titles |
| `body-lg` | 17–18px / 1.5 | Inter 400 | Marketing body copy (matches the brand guide's own body spec) |
| `body-md` | 15–16px / 1.5 | Inter 400 | Default UI/product body text |
| `body-sm` | 13–14px / 1.4 | Inter 400/500 | Secondary text, captions, helper text |
| `mono-md` | 13–14px / 1.5 | IBM Plex Mono | Status labels, data-table cells, compliance-calendar dates |
| `mono-sm` | 11–12px / 1.4 | IBM Plex Mono | Metadata, timestamps, IDs |

**Minimum body size:** 15px for any primary content on any surface — smaller sizes are reserved for metadata/captions only, per `ACCESSIBILITY_SPECIFICATION.md`.

## Spacing scale [NEW — 4px base unit]

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96` (px). Component padding/margins should always resolve to one of these values — no arbitrary spacing.

## Grid [NEW]

- **Mobile (< 640px):** single column, 16px side margins.
- **Tablet (640–1024px):** 8-column grid, 24px gutters, 24px side margins.
- **Desktop (≥ 1024px):** 12-column grid, 24px gutters, max content width 1200px (matches the brand guide's own `.max{max-width:1200px}` convention), centered.

## Breakpoints [NEW]

| Name | Width | Rationale |
|---|---|---|
| `sm` | 0–639px | Default — this is the primary design target, not an afterthought (see `RESPONSIVE_RULES.md`) |
| `md` | 640–1023px | Tablet / small laptop |
| `lg` | 1024–1439px | Desktop |
| `xl` | 1440px+ | Wide desktop — content stays capped at 1200px, extra space is margin, not stretched layout |

## Elevation [NEW]

Kept deliberately minimal — the brand guide's aesthetic is flat/hairline-based, not shadow-heavy:

| Level | Use | Treatment |
|---|---|---|
| 0 | Default surface | No shadow, hairline border only |
| 1 | Card, table row hover | `0 1px 2px rgba(11,15,26,0.06)` |
| 2 | Dropdown, popover | `0 4px 12px rgba(11,15,26,0.12)` |
| 3 | Modal | `0 20px 60px rgba(0,0,0,0.25)` — matches the brand guide's own business-card/letterhead mockup shadow treatment |

## Borders & radii [BRAND GUIDE convention, extended]

The brand guide consistently uses small, precise radii (4–6px on cards/letterhead, 2px on the Gate Mark's pillar bars) and hairline (1px) borders — never soft/pill shapes. This system continues that convention:

| Token | Value | Use |
|---|---|---|
| `radius-sm` | 2px | Small elements (tags, Gate Mark details) |
| `radius-md` | 4px | Inputs, buttons, small cards |
| `radius-lg` | 6px | Cards, modals, larger containers |
| `border-width` | 1px | Default border weight everywhere — no thick borders |

**Explicitly avoided:** large/pill radii, soft glassmorphism, heavy shadows — none of these appear in the approved brand guide, and introducing them would drift from "Precision over polish."

## Icons [NEW guidance — no icon set is specified/approved yet]

- **Style:** line/stroke-based icons, not filled — matches the brand guide's Gate Mark (stroke-based beam, solid pillars) and the mono-space, precise aesthetic.
- **Weight:** consistent stroke width across the set (recommend 1.5–2px at 24px icon size).
- **Color:** `ink`/`paper` by default (context-dependent), division color only when directly representing that division.
- **Not specified here:** a specific icon library/vendor — that's an implementation choice for the next phase, not a design-system decision this document makes.

## Motion & reduced motion [NEW]

- Default transitions: 150–200ms ease-out for hover/focus states, 200–250ms for modal/panel enter-exit.
- No decorative animation (parallax, auto-playing carousels, etc.) — matches "clarity over decoration."
- **`prefers-reduced-motion: reduce` must be respected everywhere:** all transitions/animations reduce to instant or near-instant (≤ 50ms) state changes when this is set. See `ACCESSIBILITY_SPECIFICATION.md`.

## What this document does not do

It does not replace or reinterpret the Brand Identity Guide's marketing-material specifications (business cards, letterhead, social avatars) — those remain governed by the guide directly. It does not select a specific icon library, illustration style, or photography direction — those are implementation-phase decisions informed by, but not made in, this document.
