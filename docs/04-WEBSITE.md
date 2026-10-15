# 04 — Corporate Website (`www.{domain}`)

## 1. Purpose and non-goals

**Purpose:** turn cold traffic from Facebook, LinkedIn, WhatsApp shares and Google into either (a) **qualified leads** for Advisory, Tech and Data, or (b) **learners sent to the e-learning platform**. It should do this quickly on a mobile connection, and it should earn trust without inventing proof.

**Non-goals:**
- No login.
- No client portal.
- No staff tools.
- No data beyond what the lead and newsletter forms collect.

The website must not grow back into the all-in-one application. Any feature that needs a logged-in user belongs in `learn` or `ops`.

## 2. Information architecture

```
/                         Home: problem-first hero, four divisions, proof, CTA
/advisory  /tech  /data   Division pages (structure kept from v1: mission → included → proof → objections → CTA)
/academy                  Academy overview: method, how online/blended works, trainers, FAQs
/academy/courses          Course listing (built from the LMS public catalog)
/academy/courses/{slug}   Course marketing page → "Enroll" deep-links to learn.{domain}
/about                    Company, values, registration facts → closing CTA (fixes KI-19)
/contact                  Form, phone/WhatsApp, email, address, response-time commitment
/privacy  /terms          Privacy notice (Law N° 058/2021) and website terms (fixes CR-6)
/insights                 Articles. Hidden until real content exists (v1 discipline: no empty sections)
→ learn.{domain}/login    "Log in" (header)
→ learn.{domain}/verify   "Verify a certificate" (footer)
```

Global footer: legal name, registered address, email, **phone and WhatsApp** (fixes CR-10), privacy/terms links, verify-certificate link, social links.

## 3. Carrying over the commercial-readiness fixes

Each item below was already found in `docs/release/COMMERCIAL_READINESS.md` and `docs/marketing/CONTENT_AUDIT.md`. The rebuild is the cheapest moment to close them all:

| Gap | Fix in v2 |
|---|---|
| The homepage leads with a metaphor before the pain point | The hero leads with the concrete problem and audience ("Rwandan SMEs juggling separate tax, training, systems and data vendors…"), then the "one gate, four rooms" payoff |
| No explicit audience (KI-20) | An audience line on the home page and on every division page, maintained once in the CMS's site settings |
| The About page has no CTA (KI-19) | Every page template ends with a required CTA block (the CMS enforces it) |
| No privacy policy (CR-6) | A `/privacy` page, linked next to every form's submit button |
| "Someone will follow up soon" | A concrete response-time commitment, **set by the business** in CMS settings and rendered on the confirmation message |
| Footer lacks phone/WhatsApp (CR-10) | Footer reads contact channels from CMS settings |

## 4. Content management (Payload CMS, `apps/cms`)

**Content model:**
- `Page` (block-based: hero, feature list, proof list, FAQ, CTA, rich text)
- `Division`
- `FAQ`
- `Article` (for Insights)
- `Person` (trainers and team, only with consent)
- `SiteSettings` (contact channels, response-time commitment, audience line, social links)
- `Redirect`

**Guardrails built into the schema** (enforcing the brand's no-fabrication rule by structure, not memory):
- No `testimonial`, `rating` or `client logo` block types until the business has real, consented proof. Adding one is a deliberate schema change that goes through review.
- Images require alt text. Headings are limited to a valid outline. Every page needs exactly one CTA block.
- Workflow: **Draft → In review → Published**. Only the MD or Marketing lead can publish. Version history and rollback come from the CMS.
- Publishing triggers on-demand revalidation of the affected website paths. No developer and no full redeploy.

**Migration:** the approved copy in `frontend/src/lib/content.ts` (197 lines) and the division page bodies are imported into the CMS once by a seed script. After that, the CMS is the source of truth.

**Security:** `cms.{domain}` is restricted to office or VPN IPs (or sits behind Cloudflare Access / Tailscale). Staff accounts require MFA. The CMS has its own Postgres database or schema, with no access to `identity`, `lms` or `ops`.

## 5. Rendering, delivery and failure behaviour

- **Static generation** for every page at build time, plus **on-demand revalidation** from CMS publishes and LMS `course.published` events.
- Deployed as static assets to a **CDN**. The page contains only Public-classified content, so CDN region doesn't matter for residency (ADR-004 hybrid).
- **The only runtime calls** are the lead and newsletter forms: `POST www.{domain}/api/public/leads`, routed by the edge proxy to the API (same origin, no CORS, no baked-in API URL, which fixes N-2).
- **If the API is down:** every page still renders. Forms show "We couldn't send this right now. WhatsApp us at … or call …" and keep the user's input in the form.
- **If the CMS is down:** the last published build keeps serving.

## 6. Forms and lead capture

| Control | Detail |
|---|---|
| Fields | Name, contact (email, phone or WhatsApp, deliberately free-form as in v1), need, **interest** (Advisory, Academy, Tech, Data, Not sure) |
| Consent | Required checkbox: "I agree Z-GATE may contact me about this enquiry", linked to `/privacy`. An optional, separate checkbox for marketing updates. Both are stored as `identity.consents` records with notice version and timestamp. |
| Anti-spam | Rate limit (works correctly once N-1 is fixed), honeypot field, minimum time-to-submit. No third-party CAPTCHA unless abuse is actually observed. |
| Attribution | UTM parameters and landing page captured into `crm.leads.attribution`, so lead sources are measurable (the Marketing Coordinator's weekly KPI report, `docs/product/PRODUCT_VISION.md` goal 2) |
| Audit | Lead creation and every staff read of leads are audited (fixes F-1) |

## 7. SEO

v1's technical SEO carries over: canonical URLs, sitemap, robots and Organization JSON-LD. In addition:
- `Course` JSON-LD on course pages (provider, description, `hasCourseInstance` with start dates and mode). `FAQPage` where real FAQs exist.
- The sitemap is generated from the CMS and the LMS catalog at build time, using the **runtime-correct** site URL.
- `hreflang` alternates once `rw` and `fr` content exists. No machine-translated pages are indexed without human review.
- LMS course pages are canonical to the website's course pages ([02 §6](../../docs/platform-v2/02-TARGET-ARCHITECTURE.md#6-how-the-website-hands-off-to-the-lms)).
- Off-platform but essential: Google Business Profile, with the real address and hours.

## 8. Performance budget (enforced by Lighthouse CI on every PR)

| Metric (mobile, simulated slow 4G) | Budget |
|---|---|
| JS on any page (gzipped) | ≤ 152 KB, enforced by `e2e/performance.spec.ts`. **Revised 2026-10-14:** the original 60 KB / 120 KB targets aren't reachable with Next.js, whose React DOM and runtime alone measure ~120 KB. Measured: 138 KB, down from 227 KB once zod was kept out of the browser. If this has to shrink substantially, the Astro note below is the route. |
| LCP | ≤ 2.0 s |
| CLS | ≤ 0.05 |
| Total page weight on first load | ≤ 500 KB |
| Third-party scripts | Only the self-hosted analytics script |

Images go through `next/image` with AVIF/WebP and explicit sizes. Fonts stay self-hosted and subset (v1 already does this well).

**Framework note:** Next.js is kept for the website so the team uses one framework and can share `packages/ui`. **Astro** was considered. It ships zero JS by default and supports hash-based strict CSP. Switch to it if the JS budget above can't be met with Next.js.

## 9. Security posture

- **No authentication and no user-generated content on this origin.** That removes the main risk the residual `'unsafe-inline'` CSP finding (F-5) was about, because there is no session to steal here.
  - Static Next.js pages cannot carry per-request nonces, so the website CSP keeps `script-src 'self' 'unsafe-inline'`, now with an explicit, documented justification.
  - Every other directive stays strict: `default-src 'self'`, `frame-ancestors 'none'`, `form-action 'self'`, `base-uri 'self'`, `object-src 'none'`.
  - The **learn** app, which does have sessions, gets a strict **nonce-based** CSP (see [05](../../docs/platform-v2/05-SECURITY-COMPLIANCE.md)).
- CMS rich text is rendered through an allowlist serializer. No raw HTML blocks.
- Response headers are set at the CDN or edge: HSTS (preload once the domain is final), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`. Remove `X-Powered-By` (F-7).

## 10. Accessibility and localization

- WCAG **2.2 AA**. The skip link, labelled forms, `aria-live` status messages and reduced-motion support from v1 carry over. Add `axe-core` to Playwright checks on every page template.
- Target sizes ≥ 24 px (WCAG 2.2 SC 2.5.8), visible focus not obscured (SC 2.4.11), no drag-only interactions.
- Plain language and short sentences, following the brand's "warm engineering" voice rule.
- i18n routing (`/rw/...`, `/fr/...`) is wired from day one. Locales go live only when human-reviewed content exists.
