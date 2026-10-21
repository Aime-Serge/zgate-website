# The Z-GATE Website

What the public website is for, who it serves, and the rules it keeps. Read this before changing what the site says or does. How to write for it: [CONTENT_GUIDE.md](CONTENT_GUIDE.md).

## What it's for

One job: turn a visitor from Facebook, LinkedIn, a WhatsApp share or Google into **a conversation with Z-GATE** — fast, on a phone, and without inventing proof.

- **Advisory, Tech, Data:** the visitor starts a conversation (form, WhatsApp, phone or email).
- **Academy:** the visitor finds a course and goes through the gate to Z-GATE Academy's learning platform — or joins the course's waitlist until registration opens there.

**The website is the gate, not the rooms.** It has no logins, no client portal, no staff tools and no classroom. Lessons, enrollment, assessment and certificates belong to the learning platform (a separate product and repository, ADR-007, ADR-010). If a feature needs a signed-in user, it doesn't belong here.

## Who it serves

| Visitor                          | What they need from us                                 | Where they land                      |
| -------------------------------- | ------------------------------------------------------ | ------------------------------------ |
| Small traders and SME owners     | EBM, VAT and bookkeeping handled correctly and on time | Solutions → Traders and shops        |
| Mid-size firms juggling vendors  | One relationship for books, systems and reporting      | Solutions → Growing businesses       |
| Business owners and their staff  | A short, practical course in tax, bookkeeping or EBM   | Academy → Courses                    |
| NGOs and businesses with records | A clear, honest answer to "is this working"            | Solutions → NGOs and data-rich teams |

Details, objections and the words to use: [CONTENT_GUIDE.md](CONTENT_GUIDE.md).

## Pages

| URL                                           | What the visitor gets                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                           | In order: the promise and two ways to act; the services console (a tab per division, beside how a request moves); spotlights; verifiable company facts; written commitments; the four pillars; the market problem (its source kept in the CMS); who we work with (a tab per visitor type, each leading to its solution page); situations we handle (a slowly moving row, not case studies); facts to check; what's new; how it works; three ways to get in touch |
| `/solutions`                                  | Who we work with (a card per solution page), then "What do you need help with?" (a need in the visitor's words, leading to the right division), then talk to a person                                                                                                                                                                                                                                                                                            |
| `/solutions/<slug>`                           | One page per kind of business: traders and shops, growing businesses, NGOs and data-rich teams, skills for your team. What the divisions do for that business, its written commitments, straight answers, then talk to a person, under a breadcrumb                                                                                                                                                                                                              |
| `/search`                                     | Search across services, solutions, courses, articles and pages. Results follow the typing; when nothing matches, it offers a person (form or WhatsApp). Without JavaScript it lists everything on the site                                                                                                                                                                                                                                                       |
| `/demos`                                      | The Demo Library: search; filter by service, kind of business and format; sort; save demos (this browser only); page through cards. A demo with no video yet shows "Coming soon" and offers a live walkthrough (the contact form, with the demo named). Ends with "Book a live walkthrough" and WhatsApp. The floating **Demo** button opens it                                                                                                                  |
| `/advisory`, `/tech`, `/data`                 | Who it's for → what's included → commitments as figures → straight answers → the other three rooms → talk to a person, with a sticky bar of jump links and the division's main action                                                                                                                                                                                                                                                                            |
| `/academy`                                    | The same, plus the course list                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `/academy/courses`, `/academy/courses/<slug>` | A card per course (status, format, length, fee, next intake) with two actions: **Enroll now** (to the learning platform once it's open; **Join the waitlist** until then) and **Details**; the same cards and actions are in the Academy menu. The course page adds who it's for and what you'll be able to do                                                                                                                                                   |
| `/about`                                      | Why one company, mission, vision, values, registration facts                                                                                                                                                                                                                                                                                                                                                                                                     |
| `/contact`                                    | Form, WhatsApp, phone, email, address, what happens next                                                                                                                                                                                                                                                                                                                                                                                                         |
| `/privacy`                                    | The privacy notice. **Until it's published, no form is shown anywhere** — visitors see WhatsApp, phone and email instead                                                                                                                                                                                                                                                                                                                                         |
| `/insights`                                   | Articles. Appears in the menu only once one is published (no empty sections)                                                                                                                                                                                                                                                                                                                                                                                     |

The footer on every page shows phone and WhatsApp. Every marketing page ends with a next step (the CMS refuses to publish one without it).

**Navigation** (the ServiceNow pattern, Z-GATE content): a sticky header with four mega menus (**Services**: the divisions and what each includes; **Solutions**: by kind of business and by need; **Academy**: the courses and how registration works; **Company**: about, insights, contact), a search button and "Start Now". "Log in" appears only once the learning platform is live. Phones get a drawer, a search link and a bottom bar (WhatsApp, Contact, Call).

**Header utilities** (ServiceNow's order): search; a globe with the language menu (English today, Ikinyarwanda and Français shown as "coming soon" until approved translations exist, never machine-translated tax content); **Sign in** (Z-GATE Academy Online for learners, "opens soon" until the platform is live; clients are told there is no portal and who to call); **Start Now**. Floating at the bottom right: **Start Now** and **WhatsApp** pills above the round **assistant** button.

## Rules the site keeps

- **No invented proof.** No testimonials, ratings, client logos or "trusted by" counts until real, consented ones exist — the CMS has no block for them. A market figure can't be saved without its source. Commitments always say they are targets we are held to, not past results.
- **Honest answers to hard questions.** Where we have no track record yet (Tech's external clients, employer recognition), the page says so plainly.
- **A real person replies.** The assistant (the round button) only points visitors to the site's own pages and to a person; it never stands in for one, never collects personal details, and says it is an AI if asked. No automated "someone will be in touch". The reply time shown after a form is the one the business sets in the CMS.
- **Plain language, number first.** See the voice rules in [CONTENT_GUIDE.md](CONTENT_GUIDE.md).

## Forms

- **Business enquiries:** a simple, Z-GATE-branded form with name, one free-form contact detail (phone, WhatsApp or email), one service area (or "Not sure yet"), an optional message, and contact consent. A service-page CTA preselects that division. The message prompt asks visitors not to send passwords, tax IDs or confidential client records.
- **Course waitlists:** name, contact detail and the selected course. Waitlists are routed through Academy, are not enrollment, and keep their existing separate flow.
- **Consent:** a required box to be contacted about this enquiry, linked to the privacy notice. Consent is stored with the notice version and time, and can't be edited afterwards (Law N° 058/2021).
- **Attribution:** UTM parameters, landing page and referrer are stored with the lead, so marketing can see which channel brought it.
- **Spam:** a hidden honeypot field and rate limits per visitor and site-wide. No third-party CAPTCHA unless abuse is actually seen.
- **Communication expectations:** when configured, the current reply target is shown before submission and repeated in the on-screen confirmation. A person reviews submissions; the form is not live chat and does not send automated chat/SMS replies. Visitors needing urgent contact can call or WhatsApp. Existing clients use the support route and response commitments in their agreement; no response outside a staffed channel is promised.
- **If something fails,** the visitor keeps what they typed and is offered WhatsApp, phone and email.
- Staff are emailed that a lead arrived (no personal data in the email) and work it in the CMS.

## Performance budget

Most visitors are on a phone, often on a slow connection. Enforced by the browser checks in CI (`frontend/e2e/performance.spec.ts`):

| Measure                          | Budget                                                                                        |
| -------------------------------- | --------------------------------------------------------------------------------------------- |
| JavaScript per page (compressed) | ≤ 152 KB (measured 138 KB; React and the Next.js runtime are ~120 KB of it)                   |
| Third-party scripts              | None                                                                                          |
| Fonts                            | Self-hosted, Latin subset, only the weights in use                                            |
| Images                           | None from the CMS on public pages today; when added, through `next/image` with explicit sizes |

Pages render on first visit, stay cached, and refresh within seconds of a publish — no rebuild, no waiting for a developer.

## Accessibility

WCAG 2.2 AA, checked with axe on every page type in CI (`frontend/e2e/accessibility.spec.ts`): skip link, labelled form fields, status messages announced to screen readers, visible focus, targets of at least 24 px, reduced motion respected, and button colours with at least 4.5:1 contrast.

## Search

Canonical URLs, a sitemap built from published content, `robots.txt`, structured data (`ProfessionalService` with the four divisions and `WebSite` with its search box on the homepage, `Course` on course pages, `BreadcrumbList` on solution, course and article pages), and titles and descriptions editors can set per page ("Search & sharing"). Off-site, Google Business Profile needs the real address and hours once the production domain is final.

## Where the details live

| Topic                         | Document                                 |
| ----------------------------- | ---------------------------------------- |
| Writing and editing content   | [CONTENT_GUIDE.md](CONTENT_GUIDE.md)     |
| Security and personal data    | [SECURITY.md](SECURITY.md)               |
| Running and changing the code | [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) |
| Deploying and operating       | [DEPLOYMENT.md](DEPLOYMENT.md)           |
| Decisions and their reasons   | [adr/](adr/)                             |
