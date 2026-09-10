# Z-GATE Digital Platform — Page Specifications

Structural specs (layout regions, key components, states, responsive/accessibility notes) for every page in `docs/ux/INFORMATION_ARCHITECTURE.md`. Public pages restate the Audience/Problem/Promise/Proof/Objection/CTA content from `docs/marketing/MESSAGING_FRAMEWORK.md` directly rather than re-deriving it — this document adds layout and component structure on top. MVP pages are fully specified; V1/V2 pages are scoped at the same level of detail as their backlog features currently support, not ahead of it.

---

## PUBLIC WEBSITE [MVP: Home, division pages, Contact]

### Home

- **Messaging (from `MESSAGING_FRAMEWORK.md`):** Audience — any undecided prospect. Promise — one gate, four rooms. Proof (now) — registration/licensing, market-research citations. CTA — "Start a conversation."
- **Layout regions:** Hero (display-lg headline, primary message, single CTA button) → four-division summary grid (Card component, one per division, division-colored left-border accent per `DESIGN_SYSTEM.md`'s "safe on which surface" rule) → brief "how it works" (one-gate-four-rooms explainer, plain language) → Contact CTA section.
- **Key components:** Hero, Card (×4), Button.
- **States:** static content page — no loading/empty/error states beyond standard page-load behavior.
- **Responsive:** single column `sm`, 2-column division grid `md`, 4-column `lg`+ (per `RESPONSIVE_RULES.md`).
- **Accessibility:** `h1` is the primary message, not the company name alone; division cards are a real `<nav>`-adjacent list, keyboard-traversable in order.

### Advisory / Academy / Tech / Data (division pages — same structural template, content differs)

- **Messaging:** per `MESSAGING_FRAMEWORK.md`'s per-page table for each division — Problem, Promise, Proof (now vs. to-add), Objection, CTA differ by division; do not reuse Advisory's proof points on the Tech/Data pages, since they don't apply (no external Tech/Data client exists yet).
- **Layout regions:** Division header (display-md title + one-line mission, division-color accent) → Problem/Promise section (plain-language, matches approved Mission/Vision copy) → "What's included" (service list from the relevant SLA Schedule, not fee/legal detail) → Proof section (only real, sourced proof — see `docs/marketing/MARKETING_STRATEGY.md` proof strategy; renders differently per division since Advisory has more real commitments to show than Tech/Data do at this phase) → Objection-answering FAQ-style block (plain language, matches the objection table) → CTA.
- **Key components:** Card (for "what's included" list items), Alert-style callout only if a real caveat needs surfacing (e.g., an honest "Tech is proving itself internally first" statement — matches the objection-handling requirement, not decoration).
- **Academy page specifically [V1 for enrollment CTA, MVP-viable as a static page]:** adds a course-preview Card per course (Course 1, Course 2), pulling directly from the approved Academy Course Curriculum content (duration, fee, outcomes) — see `docs/marketing/MESSAGING_FRAMEWORK.md` Academy page row.
- **Responsive/accessibility:** same pattern as Home.

### Contact

- **Messaging:** Audience — warmed-up prospect ready to act. CTA — form submission (primary) + WhatsApp link (equal weight, per `docs/marketing/SOCIAL_STRATEGY.md`).
- **Layout regions:** Form (Forms component — name, contact, stated need) side-by-side (desktop) or stacked (mobile) with a WhatsApp Business direct-contact block of equal visual prominence — not a smaller "alternative" treatment, since WhatsApp is a primary channel, not a fallback (`docs/ux/EXPERIENCE_REQUIREMENTS.md` §5).
- **States:** default (empty form), submitting (loading state on the submit button), success (Success state — in-context confirmation, per `COMPONENT_SPECIFICATION.md`'s reasoning about connection-reliability anxiety), error (Error state — form-level, e.g. network failure, distinct from field-level validation errors).
- **Accessibility:** form fully keyboard-operable, labeled, and error-associated per `ACCESSIBILITY_SPECIFICATION.md`; success confirmation announced via `aria-live`.

---

## CLIENT PORTAL [MVP: Status, Deliverables — Advisory only]

### Login

- **Layout:** centered single-column form (email/equivalent + password), Z-GATE Gate Mark + wordmark above.
- **States:** default, submitting, error (plain-language: "That email or password isn't right" — never reveals which field specifically, a standard security practice noted in `docs/product/ACCEPTANCE_CRITERIA.md` ST-06).
- **Accessibility:** standard form rules apply; error message associated with the form, not just a color change on the fields.

### Status (default landing page)

- **Purpose (from `docs/product/PRD.md` FEAT-05.1):** a client sees current compliance status and next due date in plain language.
- **Layout regions:** Status Card (largest, top-most element — this is the single most important screen in the entire MVP) showing: current status in one plain sentence, next due item + date, using `mono-md` for the date itself (precision cue) and `body-md` for the explanation.
- **States:**
  - **Populated, on track:** Success-toned Status Card, clear "you're on track" framing.
  - **Populated, approaching deadline:** Warning-toned Status Card — per `docs/ux/USER_JOURNEY_MAP.md` Journey 7, this is the highest-stakes moment for this screen; accuracy and clarity matter more here than anywhere else in MVP.
  - **Empty (new client, nothing due yet):** Empty state per `COMPONENT_SPECIFICATION.md` — explicitly not a blank or error-looking screen (ST-11 acceptance criteria).
  - **Loading:** skeleton matching the Status Card's shape.
  - **Error:** Error state, plain language, retry option.
- **Responsive:** single column at every breakpoint — this screen never needs a multi-column desktop treatment given its content is intentionally minimal.
- **Accessibility:** the status sentence is real text (not an icon-only indicator), heading hierarchy places "Status" as the page's `h1`.

### Deliverables

- **Purpose (FEAT-05.2):** list of delivered documents, viewable/downloadable.
- **Layout:** Table component (collapses to stacked cards on `sm` per `RESPONSIVE_RULES.md`) — columns: type, date, action (view/download).
- **States:** populated, empty ("No documents yet — they'll appear here as soon as your Advisory Associate uploads one"), loading, error.
- **Accessibility:** real table semantics even in the mobile card-collapsed view; download links have clear, specific labels ("Download March 2026 bookkeeping report," not "Download").

---

## STAFF PORTAL [MVP: Clients, Leads, Internal Reporting]

### Login
Same structural spec as Client Portal login, shared component, different post-login destination based on role.

### Clients (client list)

- **Purpose (FEAT-06.1):** client list sorted by compliance due date.
- **Layout:** Table (desktop/`md`+), stacked cards (`sm`) — columns: client name, next due item, due date, status badge.
- **Sort:** nearest due date first, always — not user-configurable at MVP scale (matches "simplest valuable implementation").
- **States:** populated, empty (no clients yet — realistic for Day 1 of use), loading, error.
- **Interaction:** row click/tap opens client detail.

### Client detail

- **Purpose (FEAT-06.2, FEAT-06.3):** mark close-out/filing complete, upload a Deliverable.
- **Layout:** client summary header (name, contact) → compliance timeline/list (each item with a "Mark complete" Button, opening a confirmation Modal per `COMPONENT_SPECIFICATION.md`'s critical-action rule) → Deliverables upload section (Form file-upload component + existing-deliverables Table, reusing the Client Portal's Deliverables table component).
- **States:** standard populated/loading/error; a distinct success state (inline, per-item) confirms a "mark complete" or "upload" action succeeded without a full-page reload interrupting the Associate's flow.

### Leads

- **Purpose (FEAT-03.1, FEAT-03.2, FEAT-02.2):** lead list with status/channel, manual lead entry, convert-to-client action.
- **Layout:** Table (collapsible per `RESPONSIVE_RULES.md`) with filter controls (status, channel) above it → "Add lead" Button opening a Form (manual entry) → row-level "Convert to client" action opening a confirmation Modal.
- **States:** standard set; empty state distinguishes "no leads yet" (Day 1) from "no leads match this filter" (a filtering result, not a data-absence problem) — different messages needed.

### Internal Reporting

- **Purpose (FEAT-07.1, FEAT-07.2):** Advisory summary + lead pipeline summary, one screen.
- **Layout:** Dashboard component — 2–4 stat Cards at top (active client count, on-time filing rate, lead count, conversion rate), one simple Chart below (leads by channel) per `COMPONENT_SPECIFICATION.md`'s Charts guidance.
- **States:** populated, empty (zero clients/leads — must read as an honest zero, not a broken dashboard), loading.
- **Accessibility:** every stat has a text label; the chart has an accessible data-table equivalent alongside it.

---

## ADMIN PLATFORM [V1]

### Users

- **Purpose (FEAT-09.1, FEAT-09.2):** user list, add/deactivate access.
- **Layout:** Table (name, role/division, status) + "Add user" Button opening a Form (name, contact, role assignment) → row-level deactivate action behind a confirmation Modal (access changes are consequential, same critical-action pattern as marking a filing complete).
- **States:** standard set.
- **Scoped minimally per `docs/product/PRODUCT_BACKLOG.md` EPIC-09** — no organization-wide settings page, no billing configuration UI exists at V1; this page does exactly what FEAT-09.2 needs and nothing more.

---

## Cross-page rules

- **Every page's primary heading (`h1`) states what the page is in plain language** — no page relies on navigation context alone to convey its purpose, which matters both for accessibility and for a first-time user's orientation (`docs/ux/USER_JOURNEY_MAP.md` Journey 6).
- **Every list/table page defines its own empty, loading, and error states explicitly** — none inherit a generic fallback, since the right empty-state message differs meaningfully by context (a new client's empty status page needs different words than a filtered lead list with no matches).
- **No page in this specification exists ahead of a corresponding backlog feature** — Tech Operations, Data/BI external delivery, and Security/Access-Review pages (V2) are intentionally not specified here yet; they'll be added when their phase starts, consistent with the anti-feature-creep discipline carried through every prior phase.

## What this document does not do

It does not provide pixel-level wireframes or visual mockups — layout regions and component composition are specified; exact spacing/sizing within a page is governed by `DESIGN_SYSTEM.md`'s spacing scale and `COMPONENT_SPECIFICATION.md`'s component anatomy, applied at implementation time.
