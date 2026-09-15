# Z-GATE — Messaging Framework

## Messaging hierarchy

```
LEVEL 0 — Corporate positioning (never changes, appears everywhere)
  "Where Business Meets Technology."

LEVEL 1 — Core philosophy (the "why one company, not four")
  "One gate. Four rooms. No translation lost between them."

LEVEL 2 — Primary campaign message (Business Plan §B1, verbatim)
  "Stop juggling four vendors for compliance, skills, systems and data —
   Z-GATE is the one gate for all four."

LEVEL 3 — Four supporting pillars (Business Plan §B1, verbatim — never invented, never reworded)
  Compliance certainty · Practical skills · Systems that work · Numbers you can trust

LEVEL 4 — Division-specific messages (Mission/Vision doc, "Division Copy" — used only
           on division-specific surfaces, always still traceable to Level 2)
  Advisory: "Direct answers, not hedged ones, and a filing calendar you never have to chase."
  Academy: "Not a certificate for the wall — a capability the business can point to."
  Tech: "Nothing shipped as a black box."
  Data: "A clear, honest answer to 'is this working' — not a disconnected export."
```

**Rule:** every piece of marketing content should be traceable up this chain to Level 0. A division-specific post that doesn't ladder up to "one gate, four rooms" eventually is doing division marketing, not Z-GATE marketing — acceptable for top-of-funnel awareness content, but the conversion path should always surface the bundle.

## Voice rules (Brand Identity Guide, Voice & Tone — binding on all marketing copy)

| Rule | Applied |
|---|---|
| **Direct** — say the number first | Lead with the finding/figure/answer; context follows, never precedes |
| **Plain** — no jargon without translation | Define a necessary term ("deferred tax liability," "API throughput") in the same sentence, once |
| **Warm** — write to a person, not a file | Even in Advisory/Data copy, the reader is a person making a decision |

| Situation | Instead of (banned pattern) | Z-GATE says |
|---|---|---|
| Explaining a delay | "Due to unforeseen circumstances..." | "This is running two days late because of X. Here's the new date." |
| Selling a service | "Unlock synergistic value with our solutions." | "We'll cut your close time from 12 days to 4." *(illustrative brand-voice example — not a claimed real result; do not present as an actual Z-GATE client outcome until one exists)* |
| Course description | "Empower your team's digital transformation journey." | "Six weeks. Your team ships their first pipeline in week three." |

## Objection → message mapping

Sourced from `BUYER_PERSONAS.md`. Every objection below is real and currently unresolved by any fabricated proof — the response is an honest reframe, not a deflection.

| Objection | Persona | Honest response available now |
|---|---|---|
| "I can't afford ongoing help" | Solange | Lead with the cost of *not* being compliant (EBM/VAT penalties are the real cost being compared against) — do not counter with a discount claim not in any approved pricing document |
| "Is this a real, licensed company?" | Solange, Eric | Z-GATE LTD is a registered company (RDB, TIN 156848508), with tax representation before RRA as its licensed main business activity — this is verifiable fact, safe to state plainly |
| "Why trust a brand-new company over an established bundled provider (ALSM)?" | Eric | Do not claim superiority. State the honest differentiation: Academy + Data are two divisions ALSM does not offer — a real gap, not a fabricated advantage |
| "Can Tech/Data actually deliver, or is Advisory the only real division?" | Eric | Honest staging: Tech and Data are proving themselves internally first (the company's own stated strategy) before external delivery — say this plainly rather than imply external maturity that doesn't exist yet |
| "Will employers recognize the Academy certificate?" | Aline | No employer-verification mechanism exists yet — do not claim one. Lead instead with the curriculum's real differentiator: built from actual Advisory casework, not generic content |
| "Will I actually finish the course?" | Aline | No retake/remediation process is decided yet (`docs/business/OPEN_BUSINESS_QUESTIONS.md` #12) — do not promise flexibility the business hasn't committed to; state the completion structure as documented (90% target session attendance, defined pass mark) |
| "Is my data safe with you?" | All | State what's actually true: Rwanda-based storage by default, per Law N° 058/2021 — but do **not** claim NCSA registration or DPO designation as complete, since both are still "Pending" (`docs/discovery/SECURITY_BASELINE.md`). Say "committed to" not "certified by." |

## Website page messaging (Audience / Problem / Promise / Proof / Objection / CTA)

Per-page framework for the key pages defined in `docs/ux/INFORMATION_ARCHITECTURE.md`. **Proof** fields distinguish what's available *now* (Phase 0/Day 22) from what should be added *once earned* — cross-referenced to `MARKETING_STRATEGY.md`'s proof strategy. No fabricated proof appears in any row below.

### Home

- **Audience:** Any prospect, undecided which division fits.
- **Problem:** Managing compliance, skills, systems, and data through separate, disconnected providers.
- **Promise:** One gate, four rooms — one relationship instead of four vendors.
- **Proof (now):** Registered/licensed status; the four-division structure itself as a real, operating fact; market research validating the pain point (59% of SMEs struggle with EBM — cited, not fabricated).
- **Proof (to add once earned):** First client testimonials/case studies (Business Plan §B4, Month 3 target) — not available yet, do not simulate.
- **Objection:** "Is this actually one company or four brands sharing a logo?" → Answer via the shared brand system and the "Threshold, not silo" value, stated plainly.
- **CTA:** Contact / start a conversation (low-commitment — see `CONVERSION_FUNNEL.md`).

### Advisory

- **Audience:** ICP-1 (traders) and the Advisory-need portion of ICP-2.
- **Problem:** EBM operation difficulty, VAT filing uncertainty (the single most-documented pain point in Z-GATE's own research).
- **Promise:** Compliance certainty — direct answers, a filing calendar you never have to chase.
- **Proof (now):** Registered main business activity (tax representation before RRA); SLA Schedule A's real, specific turnaround commitments (e.g., filing ≥2 business days ahead of deadline).
- **Objection:** "Can I afford ongoing help?" → reframe against the cost of non-compliance, not a discount claim.
- **CTA:** Request a consultation (see Consultation Funnel in `CONVERSION_FUNNEL.md`).

### Academy

- **Audience:** ICP-3 (youth/career-changers).
- **Problem:** Needing a job-ready, credible skill without a large time/money commitment.
- **Promise:** A capability you can point to, not a certificate for the wall.
- **Proof (now):** The two published course curricula (real, specific: duration, session count, fee, pass mark) — concrete detail is itself a proof point against vague competitors.
- **Proof (to add once earned):** Cohort 1 learner outcomes/testimonials — not available until the first cohort completes.
- **Objection:** "Will this certificate mean anything?" → honest answer: no employer-verification exists yet; lead with curriculum credibility instead.
- **CTA:** Enroll (once V1 enrollment exists) / express interest (MVP).

### Tech

- **Audience:** ICP-2 (corporates) — but note Tech has no external client yet as of this phase.
- **Problem:** Systems that don't talk to the rest of the business, or an unexplained "black box" vendor relationship.
- **Promise:** Systems built and explained plainly — nothing shipped as a black box.
- **Proof (now):** SLA Schedule C's real, specific commitments (2-hour critical-outage response, 99% monthly uptime target) — commitments, not achieved results.
- **Objection:** "Do they actually have external Tech clients?" → do not imply Tech has an external track record it doesn't have yet; state the internal-proof-first strategy honestly (the Advisory portal itself is the reference build).
- **CTA:** Start a conversation (not "sign up" — Tech is not yet selling a packaged, self-serve offering).

### Data

- **Audience:** ICP-4 (NGOs/SMEs with manual records).
- **Problem:** Sitting on real data with no clear, honest answer about whether the business is working.
- **Promise:** Numbers you can trust, built on the business's real data.
- **Proof (now):** SLA Schedule D's real accuracy commitment (99.5%, sample-audited) — a stated standard, not a claimed track record.
- **Objection:** "Is my data safe, and will it be mixed with anyone else's?" → answer honestly with the actual documented rule (Data Privacy Policy Annex D: one client's data never benchmarked against another's without consent).
- **CTA:** Start a conversation.

### Contact

- **Audience:** Any warmed-up prospect ready to act.
- **Problem:** Doesn't know what happens after submitting a form.
- **Promise:** A real person will respond — implicitly, since no automated response-time commitment is publicly documented yet.
- **Proof:** N/A — this page's job is frictionless action, not persuasion.
- **Objection:** "Will anyone actually get back to me?" → this is a real, currently-open gap (no public response-time SLA exists) — see `MARKETING_STRATEGY.md` open items.
- **CTA:** Submit the form (primary) / WhatsApp Business (equal-weight alternative, per the channel strategy).

## What this document does not do

It does not invent a testimonial, statistic, or certification to fill a proof gap — every "Proof (now)" cell above is a real, sourced fact; every "Proof (to add once earned)" cell is explicitly marked as not yet available rather than silently omitted or faked.
