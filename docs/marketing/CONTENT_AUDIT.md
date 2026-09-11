# Z-GATE Digital Platform — Content Audit

**Scope:** every string of public-facing copy on the site, all of which lives in one file, `apps/web/src/lib/content.ts`, whose own header comment states the rule this audit is checking: "sourced verbatim (or near-verbatim, noted where trimmed for length) from the approved business documents... nothing here is written freehand." This audit verifies that claim held, and separately checks the resulting pages against the five commercial-objective questions.

**This is a review, not a rewrite.** Per this phase's scope, no copy is changed here. Where a page falls short of the five-question standard, that's recorded as a finding for a future, explicitly-authorized content pass — not acted on unilaterally.

## Fabrication check — pass

Traced every field in `content.ts` back to its cited source document:

| Field | Cited source | Verified |
|---|---|---|
| `company` (legal name, trading name, motto, address, email, phone) | Business Plan / `docs/business/BUSINESS_ALIGNMENT.md` | Address explicitly noted as the *corrected* one — the brand guide's "Kigali Heights" mockup and `zgate.co`/mockup email were deliberately rejected in favor of the real registered ones |
| `elevatorPitch`, `aboutLongForm`, `mission`, `vision`, `values`, `boilerplate` | Mission/Vision doc, verbatim | No embellishment found |
| `division.included` (per-division scope lists) | Client SLA Template, Part 2 (Schedule scope) | Matches real contractual scope, not aspirational feature lists |
| `division.proof` | `docs/marketing/MESSAGING_FRAMEWORK.md`'s per-page Proof field | Each is a real, checkable commitment (e.g. Advisory's "2 business days ahead of any statutory deadline," Tech's "2-hour first response... 99% monthly uptime target," Data's "99.5%... verified by sample audit") — none is a metric invented for marketing effect |
| `division.objection` | `MESSAGING_FRAMEWORK.md`'s objection-response table | Notably, Academy's and Tech's answers are honest admissions of a real gap rather than a deflection — see below |
| `academyCourses` (name, audience, duration, fee) | Academy Course Curriculum doc | Real, approved pricing/scheduling, not placeholder figures |

**No fabricated claim, statistic, testimonial, or case study was found anywhere on the site.** Two objection-answers are worth calling out specifically because they're the clearest evidence the "no fabrication" discipline is actually being followed under commercial pressure, not just in the easy cases:

- Academy's objection answer, to "Will this certificate mean anything to an employer?": *"We don't have an employer-verification track record yet — what we can promise is a curriculum built from real work, not slides."* — a real business with something to prove would be tempted to oversell this; the copy doesn't.
- Tech's objection answer, to "Do you have external Tech clients yet?": *"Tech is proving itself internally first, on Z-GATE's own systems, before taking on external client work."* — again, states the actual current limitation rather than implying an external client roster that doesn't exist.

This matches `docs/marketing/CONTENT_STRATEGY.md`'s content-governance rule and `docs/marketing/MARKETING_STRATEGY.md`'s proof strategy, and both are being honored in the live copy, not just in the strategy document.

## Commercial objective — per page

The prompt's five questions, checked against every public page.

### Homepage (`/`)

| Question | Answer on page |
|---|---|
| Who is this for? | Implicit in the hero ("Most businesses hire a tax consultant, a trainer, a developer, and a data analyst separately") — a growing business currently juggling separate vendors. Not stated as an explicit "this is for X-sized business" segment line. |
| What problem is solved? | Explicit — "spend half their time translating between them" |
| What outcome is offered? | Explicit — one relationship instead of four, "no translation lost between them" |
| Why Z-GATE? | The "Four divisions, one relationship" and "How it works" sections carry this |
| What should the visitor do next? | Explicit, twice — "Start a conversation" CTA in the hero and again as the closing section |

**Finding (minor):** the homepage never names a concrete audience segment (size of business, sector, geography) the way `docs/marketing/BUYER_PERSONAS.md`/`ICP.md` presumably define one. A visitor infers "growing business with fragmented vendors" from context, but the page doesn't say it in as many words. Not a fabrication risk to fix — an omission worth a future content pass considering whether to state the ICP more directly (e.g. "Rwandan SMEs...").

### About (`/about`)

| Question | Answer |
|---|---|
| Who is this for? | Not this page's job — About answers "who is Z-GATE," not "who is this for" |
| What problem is solved? | Implicit, via `aboutLongForm`'s "the businesses that struggle most... are the ones whose finances, people, technology, and data all live in different places" |
| What outcome is offered? | Mission/Vision statements cover this at a company level |
| Why Z-GATE? | Values section (Threshold not silo / Precision over polish / Warm engineering) directly answers this |
| What should the visitor do next? | **Gap** — About has no CTA at all. It ends after the Values section. |

**Finding (real, worth fixing in a future pass):** every other public page ends in a "Start a conversation" or "Enroll now" CTA; About is the one page that doesn't. A visitor who reads the whole About page and is persuaded has nowhere the page itself points them. Flagged, not fixed here (a CTA addition is a content/layout change, outside this phase's "review, not rewrite" scope) — recommend adding the same closing `/contact` CTA the four division pages already use.

### Division pages (`/advisory`, `/academy`, `/tech`, `/data`)

All four share one template (`DivisionPage.tsx`), so the structural answer is identical across all four — verified per-division that the *content* backing each section is real and differentiated, not a copy-pasted generic block:

| Question | Where answered |
|---|---|
| Who is this for? | Implicit via `about` copy (e.g. Advisory: "handles the parts of the business that don't forgive a mistake"; Data: "leadership" wanting "a clear, honest answer") — again, no explicit segment statement |
| What problem is solved? | `mission` + `about`, per division, each genuinely distinct (compliance risk / skills gap / systems reliability / data trustworthiness) |
| What outcome is offered? | `included` (concrete scope) + `proof` (concrete, checkable commitment) |
| Why Z-GATE? | `proof` + `objection.answer` — the honest-limitation answers noted above are a real trust-building asset, not a weakness |
| What should the visitor do next? | Explicit "Start a conversation" CTA on every division page; Academy additionally offers "Enroll now" straight into `/academy/enroll` |

Pass on 4 of 5 questions per division; same "no explicit audience segment stated" minor gap as the homepage, consistently across all four — this reads as one homepage-level content decision rather than four separate omissions, so a future fix should likely be made once, in the messaging framework, and flow down to all five pages together.

### Academy enroll (`/academy/enroll`)

Transactional page, not a persuasion page — correctly minimal. States what happens next ("Tell us who's joining and pick a cohort — a Trainer confirms your spot shortly after") and the form itself is the CTA. All five questions are answered by the division page the visitor arrived from; this page's only job is completing the action, and it does that. No findings.

### Contact (`/contact`)

Also transactional. "Tell us what you need — a real person will follow up, not an automated response" doubles as both the value proposition (a real person, not a bot) and the implicit answer to "why Z-GATE" at this stage of the funnel (directness, matching the "Direct" brand voice). Offers both a form and direct phone/email/address contact. No findings.

## Service descriptions

Each division's `included` list is sourced to the real Client SLA Schedule scope, not a marketing-generated feature list — checked and confirmed concrete and specific (e.g. "EBM (Electronic Billing Machine) setup support and ongoing compliance monitoring," not a vaguer "compliance support"). This specificity is itself a differentiator per `docs/marketing/CONTENT_STRATEGY.md`'s stated rationale for Academy's course-preview content ("concrete specificity is itself the differentiator against vaguer training competitors") — the same logic holds for every division's scope list, not just Academy's.

## Calls to action

CTA inventory across the site: "Start a conversation" (home ×2, all four division pages, contact form submit) and "Enroll now" (Academy division page → `/academy/enroll`). Consistent, low-friction, and honest — no "Book a free consultation," "Get a free audit," or other CTA implying a service/offer that doesn't actually exist in the approved service catalog. The one real gap is About's missing CTA, noted above.

## Case studies and Insights — confirmed absent, correctly so

Neither page exists on the site, and neither is in `docs/frontend/ROUTE_MAP.md`'s approved route list — this was an explicit, documented exclusion from the very first frontend-build phase of this engagement, not an oversight being newly discovered here. `docs/marketing/CONTENT_STRATEGY.md`'s own "Case-study strategy" section confirms why: case studies are process-gated behind a real trigger ("a real client has completed at least one full service cycle") plus written client consent, targeted at Month 3+ of the content calendar. That trigger has not occurred. Publishing either page today would mean either fabricating a result (forbidden, and the thing this whole engagement has consistently refused to do across every phase) or publishing an empty placeholder page (worse for SEO and trust than not having the page at all — an empty "Case Studies" page signals the company doesn't have any, which is true, but signals it worse than simply not linking to the section).

**No action needed.** Recommend revisiting this specifically once the Case-Study Strategy's trigger condition is met — at that point it becomes a real content-production task, not a technical one.

## Insights / blog

Same status as Case Studies: not built, not in the approved route list, and `docs/marketing/CONTENT_STRATEGY.md`'s content calendar (EBM-compliance educational series, division explainers, course previews, event content) describes content meant to run on Facebook/LinkedIn in Month 1–2, not a distinct on-site blog/Insights section. If an on-site Insights section is wanted later, that's a net-new scope decision for the business to make explicitly — not something to infer from the content calendar and build unprompted.

## Summary of findings for a future content pass

None of the following were fixed in this phase (out of scope — "review," not "rewrite"):

1. **About page has no closing CTA** — every other public page ends in one; About doesn't. (Real gap, cheap fix, recommend prioritizing.)
2. **No page explicitly states its audience segment** — the ICP is inferable from context on every page but never stated in as many words. Consistent across all 5 marketing pages, so best addressed as one messaging decision, not five separate edits.
3. **Case Studies / Insights remain correctly unbuilt** — not a gap, a confirmed-correct absence; listed here only so this audit's silence on them isn't mistaken for an oversight.

## What this document does not do

It does not rewrite any copy, add a CTA, or state an audience segment on the site's behalf — those are content decisions for whoever owns `docs/marketing/` copy approval, flagged here as findings for that person's next authorized pass. It does not claim any conversion rate, engagement metric, or A/B test result — none has been measured, since (per `SEO_STRATEGY.md`) the site isn't live on a confirmed production domain yet.
