# Z-GATE Digital Platform — Accessibility Specification

**Baseline target: WCAG 2.1 Level AA**, chosen as a defensible, industry-standard baseline appropriate to the "internationally credible" and "commercially effective" principles — not a documented legal requirement in any approved Z-GATE business document (no such requirement exists in `docs/business/` or `docs/discovery/`), but a reasonable professional standard for a platform whose own persona research (`docs/ux/UX_RESEARCH.md`) spans a wide digital-literacy and device range. Where this document exceeds AA toward AAA (as several color pairs in `DESIGN_SYSTEM.md` already do), that's a bonus, not a requirement to hold every component to.

## Keyboard navigation

- Every interactive element (buttons, links, form fields, modal controls) must be reachable and operable via keyboard alone — `Tab`/`Shift+Tab` to move, `Enter`/`Space` to activate.
- Focus order follows visual/logical reading order — no focus traps outside of an intentionally modal context (see Modals below).
- A visible focus indicator (minimum 2px outline, sufficient contrast against both `ink` and `paper` surfaces) appears on every focusable element — never removed via `outline: none` without a compliant replacement.
- Skip-navigation link (e.g., "Skip to main content") on every page with a navigation menu, for keyboard/screen-reader users to bypass repeated nav on every page load.

## Readable typography

- **Minimum body text size: 15px** anywhere carrying primary content (per `DESIGN_SYSTEM.md`'s type scale) — smaller sizes reserved for metadata/captions only.
- **Line length:** body text capped around 60–75 characters per line for readability, especially relevant for the Advisory Associate's data-dense list views.
- **Line height:** minimum 1.5 for body text (matches the brand guide's own body spec of 1.5), 1.3+ for headings.
- **Text resize:** the interface must remain usable and non-clipping when browser text is scaled up to 200% — no fixed-height text containers that would clip enlarged text.
- **No text-as-image** for real content (headings, body copy) — actual text, styled, so it can be resized, selected, and read by assistive technology.

## Sufficient contrast

Directly governed by `DESIGN_SYSTEM.md`'s color-token contrast table. Binding rules:
- Body text: minimum 4.5:1 against its background (AA).
- Large text (≥ 24px, or ≥ 19px bold) and UI component boundaries/icons: minimum 3:1 (AA).
- **Division colors and semantic colors are never used as small text on light (`paper`) surfaces** — confirmed to fail (~2:1) in `DESIGN_SYSTEM.md`'s contrast table. They're safe as text only on `ink` surfaces, or as background fills/borders/icons elsewhere.
- Status/meaning is never conveyed by color alone anywhere in the system (badges, alerts, form errors, charts) — every colored indicator carries a text label or icon alongside it.

## Semantic structure

- Proper heading hierarchy on every page (`h1` → `h2` → `h3`, no skipped levels, no heading chosen for its visual size rather than its semantic level).
- Landmark regions (`<header>`, `<nav>`, `<main>`, `<footer>`) on every page, so assistive technology users can jump between regions directly.
- Real HTML form semantics: every input has an associated `<label>`; every table (`COMPONENT_SPECIFICATION.md`) uses real `<table>`/`<th scope>` markup, even when visually restyled as stacked cards on mobile.
- Buttons are `<button>`, links are `<a>` — never a `<div>` with a click handler standing in for either, which breaks keyboard operability and screen-reader semantics by default.

## Screen readers

- All non-decorative images/icons carry meaningful `alt` text; purely decorative images use empty `alt=""` so screen readers skip them rather than announcing noise.
- Dynamic content changes (form submission success, an alert appearing, a loading state resolving) are announced via appropriate `aria-live` regions (`polite` for non-urgent updates like a success message, `assertive`/`role="alert"` only for something genuinely urgent) — specified per-component in `COMPONENT_SPECIFICATION.md`.
- Modal dialogs trap focus, are announced via `role="dialog"` + `aria-labelledby`, and return focus to the triggering element on close.
- Icon-only buttons/controls always carry an `aria-label` describing the action, not just the icon's visual name.

## Touch targets

- Minimum 44×44px for any touch-reachable interactive element, minimum 8px spacing between adjacent targets — restated from `RESPONSIVE_RULES.md` because it's as much an accessibility requirement (motor-impairment consideration) as a mobile-usability one.

## Reduced motion

- Every transition/animation in `DESIGN_SYSTEM.md`'s Motion section must respect `prefers-reduced-motion: reduce` — when set, transitions collapse to near-instant (≤ 50ms) or are removed entirely, with no loss of functionality (an element that "animates in" must still simply *appear* when motion is reduced, not fail to appear).
- No auto-playing motion (carousels, animated backgrounds) exists anywhere in this system by design (`DESIGN_SYSTEM.md`: "no decorative animation") — this isn't a reduced-motion exception, it's a baseline rule that happens to also serve reduced-motion users.

## Digital-literacy & plain-language accessibility (extends beyond WCAG — sourced to `docs/ux/`)

This is not a standard WCAG category, but `docs/ux/UX_RESEARCH.md` identifies a real, documented need beyond technical accessibility: the client base spans from Aline (high digital fluency) to Jean (near-zero) and Solange (WhatsApp-native, not app-native). This shapes the design system beyond compliance checkboxes:
- No unexplained jargon anywhere in the UI (brand voice rule, binding on interface copy exactly as it's binding on marketing copy).
- Status must be expressible in one plain sentence, not a technical state name (`COMPONENT_SPECIFICATION.md`, Badges/Alerts).
- Critical actions get a confirmation step (Modals) specifically because a first-time software user is more likely to make an unintended mis-click than an experienced one.

## Internationalization readiness (flagged, not built)

`docs/ux/EXPERIENCE_REQUIREMENTS.md` §2 records an unresolved business question: whether Kinyarwanda/French support is required. This design system does **not** implement multilingual support (no approved requirement exists yet), but stays i18n-ready as a defensive design practice:
- No text baked into images or fixed-width containers that would break under longer translated strings.
- Layouts accommodate reasonable text-length variation (a French or Kinyarwanda label may run longer than its English equivalent) without breaking.
- This is a **forward-compatibility hygiene practice**, not a commitment to build localization now — do not read this section as scoping i18n into MVP.

## What this document does not do

It does not certify actual WCAG AA compliance (that requires testing real, implemented interfaces — automated and manual, including with real assistive technology) — it specifies the target and the binding rules implementation must follow. It does not select specific ARIA library/tooling choices, which is an implementation-phase decision.
