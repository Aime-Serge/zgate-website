# Z-GATE — Conversion Funnel (Lead, Consultation, Referral, CTA Strategy)

Builds directly on `docs/ux/USER_JOURNEY_MAP.md` journeys 1–5 (Discover → Explore → Request consultation → Become lead → Become client) and `docs/product/PRODUCT_BACKLOG.md` EPIC-02/03 (Lead Generation, CRM foundation). This document adds the marketing-strategy layer on top of those already-scoped product mechanics — it does not redesign them.

## Lead funnel

```
AWARENESS         → Facebook/LinkedIn content, word of mouth, PSF/RDB referrals
     ↓
INTEREST          → Website visit (division page) or direct WhatsApp inquiry
     ↓
ACTION             → Contact form submission OR WhatsApp message
     ↓
LEAD (CRM record) → Channel + stated need logged (docs/product/PRODUCT_BACKLOG.md FEAT-02.1/02.2)
     ↓
QUALIFICATION      → Advisory Associate/MD assesses division fit (docs/business/BUSINESS_WORKFLOWS.md §1)
     ↓
CONSULTATION       → see Consultation Funnel below
     ↓
CLIENT             → SLA signed (docs/business/BUSINESS_WORKFLOWS.md §2)
```

**Funnel principle:** every stage above already exists as a defined business or product process — this document sequences marketing activity to feed it, not invent a parallel structure.

## Consultation funnel (the human-mediated middle stage)

This is deliberately **not** a self-serve, automated funnel — matching `docs/product/PRD.md`'s explicit non-goal of a marketing-automation suite and the UX finding that WhatsApp/human contact is where trust is actually built (`docs/ux/USER_JOURNEY_MAP.md` Journey 4, "First human contact... this is a person, not a form").

| Step | What happens | Owner | SLA/target |
|---|---|---|---|
| 1. Lead received | Form or WhatsApp message logged | System/Marketing Coordinator | Same-day acknowledgment target (no formal SLA is publicly documented for lead response time — see Open Items) |
| 2. Qualification | Division fit assessed against ICP.md | Advisory Associate / MD | — |
| 3. Consultation conversation | Direct discussion of the specific need (EBM issue, bundle interest, course fit) | Advisory Associate / MD | Matches the brand voice rule: "say the number first," direct answers |
| 4. Proposal / Schedule discussion | Which Service Schedule(s) fit, fee discussion | MD (until a Service Delivery Lead exists) | Out-of-Schedule scope always quoted separately (SLA Clause 3) |
| 5. SLA signing | Master SLA + Schedule(s) signed | MD + Client | Becomes a Client record (`docs/business/BUSINESS_WORKFLOWS.md` §2) |

**Do not automate this stage prematurely.** The UX research is explicit that first human contact is a disproportionately important trust moment for a brand-new company — collapsing it into a chatbot or fully self-serve flow before Z-GATE has any track record would remove the one thing currently doing the heaviest trust-building work.

## CTA strategy

| Context | CTA | Why this CTA, not a stronger one |
|---|---|---|
| Homepage, first visit | "Start a conversation" / "Contact us" | Low-commitment — matches an unproven brand asking for a first, small yes, not a purchase |
| Advisory page | "Request a consultation" | Slightly warmer than generic contact, since the visitor has self-selected a specific need |
| Academy page (MVP) | "Express interest" | Enrollment (V1) doesn't exist yet in the product — do not offer a CTA the platform can't fulfill |
| Academy page (V1+) | "Enroll" | Once FEAT-08.2 exists |
| Tech/Data pages | "Start a conversation" (not "Get started" or "Sign up") | Neither division sells a packaged, self-serve offering yet — the CTA should not imply a maturity the product doesn't have |
| Contact page | "Send message" + WhatsApp Business link, equal visual weight | Matches the channel strategy — WhatsApp is not a fallback, it's a primary channel for the dominant persona (Solange) |

**CTA principle:** no CTA should promise more than the current product/business can deliver (`docs/product/PRODUCT_ROADMAP.md` phase gating applies to marketing copy too, not just engineering).

## Referral strategy

Sourced directly to the Business Plan — this section does not invent referral mechanics beyond what's approved:

- **Referral incentive for existing Advisory clients** — explicitly scheduled for Month 3 (§B4, "Conversion & Proof" phase). **No incentive structure (discount %, cash value, etc.) is defined in any approved document** — this must come from the Managing Director before any referral offer is communicated; do not invent terms.
- **Partnership-based referral pipeline (not yet active — target relationships, per §B7):**
  - RDB One Stop Centre — referral pipeline for newly registered businesses needing Advisory.
  - PSF district chapters — trust-building, SME access in Nyarugenge and secondary cities.
  - ICPAR — professional credibility for Advisory (pursuing, not confirmed).
  - Universities & TVET schools — Academy trainer pipeline and course credibility.
  - Software vendors (Zoho/Frappe or equivalent) — Tech implementation partnership, following the model ALSM has already validated in-market.
- **Cross-division referral (internal, not yet a defined process):** the "one gate, four rooms" philosophy implies an Advisory client should eventually be a natural Academy/Data prospect too — but `docs/business/CROSS_DIVISION_WORKFLOWS.md` (Phase 1) already flagged that **no formal cross-sell trigger, owner, or process exists** for this. Marketing should not build campaigns assuming a cross-sell mechanism that doesn't exist yet; this is a business-process gap, not a marketing-tactics gap.

## What this document does not do

It does not set a numeric lead-to-client conversion rate target beyond what the Business Plan already states (10 retainer clients from the lead pipeline by Day 90), does not invent a referral-incentive value, and does not propose replacing the human consultation stage with automation.
