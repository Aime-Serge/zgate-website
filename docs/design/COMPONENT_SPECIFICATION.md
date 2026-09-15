# Z-GATE Digital Platform — Component Specification

Every component below uses only tokens from `DESIGN_SYSTEM.md`. Each entry states purpose, anatomy, states, variants, accessibility notes, and which `docs/product/PRODUCT_BACKLOG.md` feature(s) actually need it — no component is speculative; if nothing in the backlog uses it yet, it's marked accordingly rather than fully specified ahead of need.

## Buttons

- **Purpose:** primary user actions (submit, confirm, navigate to a key task).
- **Anatomy:** label (required), optional leading icon, padding per spacing scale (12px vertical / 24px horizontal for default size).
- **Variants:** Primary (`ink` fill / `paper` text on light surfaces, or `gate-2` accent border on dark), Secondary (outline, `border-width` hairline), Tertiary/text-only (no fill/border, for low-emphasis actions like "Cancel").
- **States:** default, hover (subtle darken/lighten per surface), focus (visible 2px outline, see `ACCESSIBILITY_SPECIFICATION.md`), active/pressed, disabled (reduced opacity, never color-only to indicate disabled), loading (inline spinner replaces label, button stays same width to avoid layout shift).
- **Sizing:** minimum 44×44px touch target on any surface where touch is possible — see `RESPONSIVE_RULES.md`.
- **Accessibility:** button text must describe the action ("Mark filing complete," not "Submit"); icon-only buttons require an `aria-label`.
- **Used by:** every MVP feature with an action (ST-05 convert-lead, ST-09 mark-complete, ST-10 upload).

## Links

- **Purpose:** navigation, inline references.
- **Anatomy:** text, always underlined in body copy (not color-only — a real accessibility requirement given division colors fail contrast on light surfaces).
- **States:** default (`gate-1`/`info` on light surfaces, `gate-2` on dark), hover, focus (visible outline), visited (not distinguished — not meaningful for this product's content).
- **Accessibility:** never convey meaning by color alone; link text must make sense out of context (no bare "click here").
- **Used by:** website navigation (EPIC-01), in-app cross-references.

## Forms

- **Purpose:** lead capture, enrollment, internal data entry (mark complete, upload).
- **Anatomy:** label (always visible, never placeholder-only — placeholder text disappears on input, harming both usability and accessibility), input, helper text (optional), error text (appears on validation failure, `error` token, with an icon not just color).
- **States:** default, focus, filled, error (with specific, plain-language message — "Enter a valid phone number," not "Invalid input"), disabled.
- **Variants:** text input, textarea, select, file upload (FEAT-06.3 Deliverable upload), checkbox/radio (Service Schedule selection, if ever surfaced in-product).
- **Accessibility:** every input has a programmatically associated `<label>`; error messages are associated via `aria-describedby`; required fields are marked both visually and with `aria-required`.
- **Mobile:** appropriate input types (`tel`, `email`) to trigger correct mobile keyboards — directly serves the mobile-first UX requirement.
- **Used by:** FEAT-01.2/02.1 (lead form), FEAT-08.2 (enrollment, V1), FEAT-06.2/06.3 (Advisory Associate data entry).

## Cards

- **Purpose:** grouping related content — a client summary, a course preview, a deliverable entry.
- **Anatomy:** optional header (title + optional division-color left-border accent), body, optional footer/action row.
- **Variants:** Summary card (client list item, FEAT-06.1), Content card (course preview, FEAT-08.1), Status card (compliance status, FEAT-05.1 — this is the single most important card in MVP).
- **States:** default, hover (if interactive/clickable), selected (if part of a list with selection).
- **Accessibility:** if a card is a single clickable unit, the entire card is one focusable/keyboard-activatable element with one clear label — not multiple nested interactive elements competing for focus.
- **Used by:** FEAT-05.1, FEAT-06.1, FEAT-08.1.

## Tables

- **Purpose:** lead lists, client lists, deliverables lists — the core data-dense views of the Staff Portal.
- **Anatomy:** header row (Inter 500/600, not mono — mono is for cell data, not headers), rows, optional row actions (right-aligned), optional status badge per row.
- **States:** default, row hover, empty (see Empty States below), loading (see Loading States below).
- **Responsive behavior:** on `sm` breakpoint, tables collapse to a stacked card-per-row layout (a true horizontal table is not usable on a narrow phone screen) — see `RESPONSIVE_RULES.md`.
- **Accessibility:** proper `<table>` semantics (`<th scope="col">`, etc.) even when visually restyled as cards on mobile — screen reader users still get a real table structure.
- **Used by:** FEAT-03.1 (lead list), FEAT-06.1 (client list), FEAT-05.2 (deliverables list).

## Badges

- **Purpose:** compact status indicators — lead status (new/qualified/converted/lost), compliance status, ticket severity (V2).
- **Anatomy:** short label (1–2 words), colored background fill (semantic or division token) with `ink` text, `radius-sm`.
- **Variants:** Status (neutral gray, `success`, `warning`, `error`), Division (one per division, used only in multi-division contexts like Eric's future portal view).
- **Accessibility:** status is never color-only — badge text always states the status in words ("Converted," not just a green dot).
- **Used by:** FEAT-03.1, FEAT-05.1.

## Alerts

- **Purpose:** page-level or section-level messages — a compliance deadline approaching, a form submission error, a confirmation.
- **Anatomy:** icon (matching semantic color), message text, optional dismiss action.
- **Variants:** Info (`info` token), Success (`success` token), Warning (`warning` token), Error (`error` token).
- **Accessibility:** rendered with `role="alert"` (or `role="status"` for non-urgent updates) so screen readers announce them; never rely on icon/color alone — message text always states the nature of the alert.
- **Used by:** ST-11 (compliance status framing — an approaching deadline is a Warning-variant alert, not just a date on a page), form validation across all MVP forms.

## Modals

- **Purpose:** confirming a consequential action (e.g., marking a filing complete) or a focused task that shouldn't navigate away from context.
- **Anatomy:** overlay (dims background), dialog container (`elevation-3`, `radius-lg`), title, body, action row (primary + secondary/cancel button).
- **States:** entering, open, exiting (respects reduced-motion).
- **Accessibility:** focus is trapped within the modal while open, focus returns to the triggering element on close, `Escape` closes the modal, the modal is announced via `role="dialog"` + `aria-labelledby` pointing to its title.
- **Used sparingly:** per `docs/ux/EXPERIENCE_REQUIREMENTS.md` §4, critical actions (marking a compliance item complete) should be "hard to trigger accidentally" — a confirmation modal is the mechanism for that, not decorative use elsewhere.
- **Used by:** FEAT-06.2 (confirm marking a filing/close-out complete — a compliance-critical action).

## Navigation

- **Purpose:** moving between sections of a surface (public website, Client Portal, Staff Portal, Admin).
- **Anatomy:** varies by surface — see `docs/ux/INFORMATION_ARCHITECTURE.md` for the actual structure each surface needs.
- **Public website:** horizontal top nav (desktop), collapses to a hamburger/drawer menu on `sm` — standard, low-risk pattern for an unfamiliar-brand visitor.
- **Client Portal:** intentionally flat navigation (Status, Deliverables — two items in MVP) per the IA's explicit "don't promise a capability that doesn't exist" rule; expands only as V1/V2 modules ship.
- **Staff Portal / Admin:** sidebar navigation on `md`+ , collapsible to a bottom-tab or drawer pattern on `sm`, scoped per the Data Privacy Policy's role-based access rule (`docs/business/ROLE_MATRIX.md` §4) — a user never sees a nav item for a division/module their role doesn't cover.
- **Accessibility:** current page/section is indicated both visually and via `aria-current="page"`; nav is keyboard-traversable in a logical order.

## Dashboards

- **Purpose:** the MD's internal reporting view (FEAT-07.1/07.2), and eventually Data's external dashboard (V2).
- **Anatomy:** a small number of summary stat cards (count, rate) at the top, optionally one or two simple charts below — deliberately not a dense, configurable BI grid at MVP scale, matching FEAT-07.1's "simplest valuable implementation" (pre-defined numbers, not a configurable tool).
- **States:** populated, empty (zero clients yet — must read as a real, honest zero, not an error), loading.
- **Accessibility:** every stat has a text label, not just a number — screen readers and low-vision users get the same information sighted users do.
- **Used by:** FEAT-07.1, FEAT-07.2.

## Charts

- **Purpose:** at MVP scale, minimal — a simple trend or proportion view at most (e.g., leads by channel).
- **Type guidance:** simple bar/column charts for comparisons, simple line charts for trends over time — no 3D, no unnecessary decoration, per "clarity over decoration." Avoid pie charts for more than 3–4 segments (readability).
- **Accessibility:** every chart has an accessible data-table equivalent or a text summary alongside it — a chart is never the *only* way to access the underlying data (this matters especially for the low-vision/screen-reader segment of the accessibility requirements).
- **Color:** semantic/division tokens only, never arbitrary chart-library default colors, to stay consistent with the "one accent per context" rule.
- **Used by:** FEAT-07.2 (lead pipeline by channel) — the only chart-shaped need identified in the current backlog; nothing beyond this is specified speculatively.

## Empty states

- **Purpose:** communicate "nothing here yet" honestly, distinct from an error — directly answers `docs/ux/USER_JOURNEY_MAP.md` Journey 6's finding that a new/empty account must not read as broken.
- **Anatomy:** short, plain-language message explaining *why* it's empty and, where relevant, what happens next ("No filings due yet — you'll see them here as soon as one is scheduled," not a blank space or a generic "No data").
- **Used by:** FEAT-05.1 (ST-11's explicit acceptance criteria), FEAT-07.1 (zero clients state), FEAT-03.1 (no leads yet).

## Loading states

- **Purpose:** communicate that data is being fetched, especially relevant given the mobile/low-bandwidth-connection requirement — a stalled screen with no feedback reads as broken.
- **Anatomy:** skeleton placeholders matching the eventual content's shape (preferred over a generic spinner for list/card content) or an inline spinner for button actions.
- **Timing rule:** anything expected to take > 300ms shows a loading state; anything faster doesn't bother, to avoid flicker.
- **Accessibility:** loading regions use `aria-busy="true"` and an `aria-live` region announces completion for screen reader users.

## Error states

- **Purpose:** a failed action or failed data load — distinct from a form validation error (see Forms above), which is inline; this is page/section-level.
- **Anatomy:** plain-language explanation of what went wrong and, where possible, a retry action — never a raw technical error message to an end user (matches the brand voice rule: "This is running two days late because of X. Here's the new date," not "Due to unforeseen circumstances").
- **Used by:** any network/data-fetch failure across every MVP screen — a cross-cutting requirement, not a single feature's concern.

## Success states

- **Purpose:** confirm an action completed — form submission (ST-02), marking a task complete (ST-09), upload (ST-10).
- **Anatomy:** brief confirmation message, ideally in-context (near the action taken) rather than only a page-level toast that could be missed — matches the UX finding that "did it actually submit" anxiety is real on unreliable connections (`docs/ux/USER_JOURNEY_MAP.md` Journey 3).
- **Accessibility:** announced via an `aria-live="polite"` region so screen reader users get the confirmation without it interrupting their current focus.

## What this document does not do

It does not specify pixel-level component dimensions, a specific component library/framework (React component API, CSS methodology, etc.), or visual mockups — those are implementation-phase decisions. Every component here is scoped strictly to what an already-approved backlog feature actually needs; nothing is speculative ahead of product need.
