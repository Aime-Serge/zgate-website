# Z-GATE Digital Platform — Technical SEO Audit

**Scope:** the 7 public, indexable pages (`/`, `/about`, `/advisory`, `/academy`, `/academy/enroll`, `/tech`, `/data`, `/contact` — 8 counting `/academy/enroll` separately) that `docs/frontend/ROUTE_MAP.md` approves. Authenticated surfaces (`/login`, `/forgot-password`, `/reset-password`, `/portal`, `/staff`) are in scope only for *exclusion* (robots/sitemap) — they carry no public SEO value and were never meant to rank.

**Ground rule:** every fix below either corrects a mechanical gap (a missing tag, a stale list) or marks up facts already approved and already live on the page (`apps/web/src/lib/content.ts`). Nothing here invents a claim, a rating, a review count, or a domain. Where a real blocker is business-level, not technical, it's named and left alone — see **Open, non-technical blocker** below.

## Summary

| Area | Status | Action taken |
|---|---|---|
| Titles / descriptions | Pass | None needed |
| Headings / semantic HTML | Pass | None needed |
| Canonical URLs | Gap → Fixed | Added `alternates.canonical` to all 8 public pages |
| Sitemap | Gap → Fixed | Added missing `/academy/enroll`; static-page-count reasoning documented |
| Robots | Gap → Fixed | Added `disallow` for all 5 auth-gated route roots |
| Structured data | Gap → Fixed (minimal) | Added `Organization` JSON-LD, fact-only |
| Internal links | Pass | None needed |
| Image metadata | N/A | No images exist on the site (see below) |
| Page speed | Cross-referenced | See `docs/performance/PERFORMANCE_REPORT.md` |
| Accessibility | Cross-referenced | See `docs/qa/` |
| Indexing strategy | Documented | See below |

## Titles and descriptions

Every public page exports its own `metadata.title`/`metadata.description` (Next.js App Router `Metadata` API), and every value traces to `lib/content.ts` — no page hand-writes SEO copy:

| Page | Title (rendered via layout's `%s — Z-GATE LTD` template) | Description source |
|---|---|---|
| `/` | `Z-GATE LTD — Where Business Meets Technology` (layout default) | `elevatorPitch` |
| `/about` | `About — Z-GATE LTD` | `mission` |
| `/advisory`, `/academy`, `/tech`, `/data` | `Z-GATE {Division} — Z-GATE LTD` | `division.mission` |
| `/academy/enroll` | `Enroll — Z-GATE LTD` | Fixed short sentence |
| `/contact` | `Contact — Z-GATE LTD` | `Get in touch with Z-GATE LTD.` |

No duplicate titles, no missing descriptions, no title over ~60 characters that would truncate in a SERP. Pass, no action needed.

## Headings and semantic HTML

Checked every public page and shared layout component for heading order:

- Exactly one `<h1>` per page, always the page's real subject (not the brand name repeated) — e.g. `/advisory`'s `<h1>` is the division's actual mission statement, not "Advisory."
- `<h2>` used consistently for major sections (`What's included`, `Current courses`, objection-handling section, footer's `Divisions`/`Company` groups); `<h3>` reserved for items nested one level deeper (values on `/about`, individual cards). No level is skipped anywhere in `DivisionPage.tsx`, `about/page.tsx`, `page.tsx` (home), or `Footer.tsx`.
- Landmark elements are used correctly: `<header>`/`<nav aria-label="Primary">`/`<main id="main">`/`<footer>` in the root layout and `Header.tsx`; `DivisionPage.tsx` and `about/page.tsx` each open with their own `<header>` for the page-level intro block, `<section>` per content block.
- `<nav>` is labelled (`aria-label="Primary"` desktop, `"Primary, mobile"` for the mobile disclosure), so the two navs are distinguishable to assistive tech and not a duplicate-landmark problem.

Pass, no action needed.

## Canonical URLs — gap, fixed

Before this audit, `grep -rln "alternates\|canonical" src/` returned nothing — no page declared a canonical URL. Given the root layout already sets `metadataBase`, this was a pure omission, not a design choice.

**Fixed:** added a self-referencing `alternates: { canonical: "<path>" }` to all 8 public pages' existing `metadata` exports (or, for the homepage, added a `metadata` export where none existed before — it previously inherited the layout defaults with no page-level object at all). Verified in the production build's rendered HTML, e.g.:

```
<link rel="canonical" href="http://localhost:3001/advisory"/>
<link rel="canonical" href="http://localhost:3001"/>
```

Every public page's canonical is relative to the same `NEXT_PUBLIC_SITE_URL`-derived `metadataBase` the rest of the site already uses — so it will resolve correctly against whichever real production domain is eventually confirmed, without this file needing to change (see **Open, non-technical blocker**).

## Sitemap — gap, fixed

`sitemap.ts` was written before `/academy/enroll` existed as a route and was never updated. It listed only `/`, `/about`, `/contact`, and the four division pages — a real, live, valuable conversion page was invisible to crawlers.

**Fixed:** added `/academy/enroll` (priority 0.7, `monthly` — it's a form page tied to live cohort scheduling, changes more often than `/about`). Verified in the build output:

```
<loc>http://localhost:3001/academy/enroll</loc>
```

Auth-gated routes remain correctly excluded (they were never listed) — that's intentional, not a gap; see Robots below for the matching exclusion on the crawl side.

## Robots — gap, fixed

`robots.ts` previously allowed `*` to crawl `/` with no `disallow` at all — meaning `/login`, `/forgot-password`, `/reset-password`, `/portal`, and every `/staff/*` route were crawlable and indexable in principle, despite being authentication-gated pages with no public content value (and, for `/staff`, containing no content at all until a session exists — the page would render an empty/redirect shell to a crawler).

**Fixed:** added `disallow` for the five route roots. Standard `robots.txt` prefix matching means each entry also covers its subtree (`/staff` covers `/staff/leads`, `/staff/clients/:id`, `/staff/academy/:cohortId`, etc. — confirmed in the generated output):

```
User-Agent: *
Allow: /
Disallow: /login
Disallow: /forgot-password
Disallow: /reset-password
Disallow: /portal
Disallow: /staff
```

This is defense-in-depth, not the access control — every one of these routes is already protected by session/role checks server-side and client-side. `robots.txt` only stops a compliant crawler from *wasting a crawl budget* on pages it could never usefully index; it is not, and was never treated as, a security boundary.

## Structured data — gap, fixed (minimal, fact-only)

Before this audit, `grep -rln "application/ld+json\|schema.org" src/` returned nothing — zero structured data anywhere on the site.

**Decision on what to implement:** a single `Organization` JSON-LD block in the root layout (renders on every page), built only from fields already public and already approved in `company` (`lib/content.ts`):

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Z-GATE LTD",
  "alternateName": "Z-GATE Solution",
  "url": "<siteUrl>",
  "email": "info@zgaterw.com",
  "telephone": "+250 792 957 513",
  "address": "Inyarurembo, Kiyovu, Nyarugenge, Kigali, Rwanda"
}
```

**Deliberately not implemented:**
- `aggregateRating` / `review` — no real reviews exist; fabricating a rating is exactly what this engagement's "do not fabricate claims" rule exists to prevent.
- `LocalBusiness` (a more specific type than `Organization`, which Google's Local SEO features generally prefer) — deferred until `docs/marketing/SEO_STRATEGY.md`'s Google Business Profile is actually created; publishing a `LocalBusiness` schema not backed by a live GBP listing is more likely to look inconsistent to a search engine than helpful.
- `Course` schema on `/academy` for `academyCourses` — a genuinely real, non-fabricated candidate (name, duration, fee are all real), but it's a page-content decision with its own markup surface area, not a one-line technical fix; flagged here as a good candidate for a future, explicitly-scoped SEO pass rather than added unilaterally in this one.
- Per-division `Organization`/`Service` schema — `included` arrays are real SLA-sourced scope items, but structuring them as `schema.org/Service` offerings is again a content-shaped decision better scoped deliberately, not folded into a technical-fixes commit.

JSON-LD payload uses `JSON.stringify(...).replace(/</g, "\\u003c")` per Next.js's own guidance (`node_modules/next/dist/docs/01-app/02-guides/json-ld.md`) — defense-in-depth against script-injection via the serialized payload, even though every field here is a static string with no user input.

## Internal links

- Every public page ends in an explicit next step: `/`, `/advisory`, `/tech`, `/data` end in a "Start a conversation" → `/contact` CTA; `/academy` additionally links to `/academy/enroll` ("Enroll now") directly beneath its course list.
- Primary nav (`Header.tsx`, sourced from the single `navLinks` list in `lib/nav.ts`) links to all 6 top-level public pages from every page on the site, desktop and mobile.
- Footer (`Footer.tsx`) duplicates division links plus About/Contact, and is present on every page — every public page is reachable within one click of every other public page. No orphaned pages.
- `navLinks` has a code comment enforcing that it can never drift ahead of `docs/frontend/ROUTE_MAP.md`'s approved route list — this audit found no unapproved links and no broken internal links.

Pass, no action needed.

## Image metadata — N/A

Confirmed (again, as in the Performance review — `docs/performance/PERFORMANCE_REPORT.md`) that the site has zero image assets: the only graphic on the site, `GateMark`, is an inline SVG React component, not an `<img>` or `next/image` usage. There is no `alt` text, `next/image`, or Open Graph image to audit because none exists. `openGraph.images` is correspondingly unset in `layout.tsx` — leaving it unset rather than inventing or generating a placeholder OG image is the correct call under the "do not fabricate" rule; a generated placeholder would misrepresent the brand rather than help it.

## Page speed — cross-referenced

Already measured in this engagement's Performance phase; not re-measured here. See `docs/performance/PERFORMANCE_REPORT.md`'s "What was measured, and found to already be fine" section (static page response time, dynamic route response time, compression/caching headers, font loading, code-splitting, image optimization — N/A per above, rendering strategy) and its Core Web Vitals section (reasoned, not measured — no browser available in this environment, same limitation noted there as here).

## Accessibility — cross-referenced

Already assessed in this engagement's QA phase; not re-audited here. See `docs/qa/TEST_STRATEGY.md` and `docs/qa/DEFECTS.md` (G-02): accessibility intent is built into every page (semantic HTML — confirmed independently in this audit's Headings section above — ARIA labelling, `aria-live`/`aria-busy` loading states, real `<table>` semantics under responsive collapse, focus-visible styles) but has never been machine-checked (no axe-core/jest-axe wired into the suite). That gap is QA's to close, not duplicated here.

## Indexing strategy

- **Allow:** all 8 public pages, via the default `Allow: /` rule plus their presence in `sitemap.xml`.
- **Disallow (this audit's fix):** all 5 authenticated route roots, so crawl budget and search-result real estate are never spent on pages a logged-out visitor can't use anyway.
- **No `noindex` meta tags exist anywhere** — correct for this site, since every indexable page is genuinely public content; a `noindex` would only be needed for a public-but-not-wanted-in-search page, and none exists on this site's approved route list.
- **Sitemap submission and Google Search Console verification are explicitly out of scope for this document** — both require a confirmed production domain, which does not yet exist (see below). Recorded here as a follow-up once that's resolved, not actioned now.

## Open, non-technical blocker (not fixed here — flagged, per `docs/marketing/SEO_STRATEGY.md`)

`SEO_STRATEGY.md` already documents this and it still holds: **the production domain is unconfirmed** — `info@zgaterw.com` is the real, confirmed contact, while `zgate.co` is a brand-guide mockup. `NEXT_PUBLIC_SITE_URL` (used by `layout.tsx`, `robots.ts`, `sitemap.ts`, and this audit's new canonical/JSON-LD `url` field) is deliberately never hardcoded anywhere in the codebase for exactly this reason — it falls back to `http://localhost:3001` in dev and picks up whatever real domain is set via environment variable at deploy time. Every fix in this document already routes through that same variable, so no code change is needed once the domain is confirmed — only setting the environment variable in production. This is a Managing Director decision, not a technical one, and is not made here.

## What this document does not do

It does not claim any current search ranking, indexed-page count, or organic traffic figure — none exists, since (per `SEO_STRATEGY.md`) no website has been live under a confirmed production domain. It does not recommend SEO tooling spend beyond what's already allocated. It does not implement `Course`/`Service`/`LocalBusiness` structured data, sitemap submission, or Google Business Profile setup — each is flagged above as a deliberate, scoped follow-up, not silently skipped.
