"""
Seed content: the approved copy (approved_copy.json) and the page layouts
built from it. The seed only fills an empty CMS; after that, editors own
the content in the admin.

Copy is approved text except the interface wording of the doors and the
steps, which restates approved facts - who we serve and how a first
conversation goes (docs/CONTENT_GUIDE.md) - signed off in the marketing
review of 19 October 2026 and revised client-first on 20 October 2026.
"""

from __future__ import annotations

import json
from html import escape
from pathlib import Path
from typing import Any

COPY: dict[str, Any] = json.loads(
    (Path(__file__).with_name("approved_copy.json")).read_text(encoding="utf-8")
)


def paragraphs(*texts: str) -> str:
    return "".join(f"<p>{escape(text)}</p>" for text in texts)


def _primary_cta() -> dict[str, str]:
    return dict(COPY["primaryCta"])


def home_layout() -> list[tuple[str, dict[str, Any]]]:
    """
    The homepage, section by section: a centred hero, the services console,
    spotlights, verified facts, written commitments, the four pillars, the
    market problem, who we serve, situations we handle, what a visitor can
    check, what's new, how it works, and a closing call to action.
    """
    c = COPY
    cta = _primary_cta()
    return [
        (
            "hero",
            {
                "eyebrow": c["company"]["motto"],
                # The approved primary message (90-Day Plan §B1), unchanged;
                # its opening words carry the brand gradient.
                "headline": c["primaryMessage"]["headline"],
                "headline_accent": "Stop juggling four vendors",
                "lede": (
                    f"{c['primaryMessage']['answer']} Tax and EBM compliance, practical training, "
                    "the systems you run on and the numbers that show whether it's working: one "
                    "team that already knows your business, one agreement, one conversation."
                ),
                "cta": cta,
                "layout": "centered",
                "visual": "none",
            },
        ),
        (
            "showcase",
            {
                "eyebrow": "One gate, four rooms",
                "heading": "Everything your business runs on, behind one door",
                "intro": (
                    "Pick a division to see what's included. Each one is a specialist team, and "
                    "all four share what they learn about your business."
                ),
                "steps_heading": "How a request moves",
                "steps": [
                    "You message us: WhatsApp, phone, email or the form",
                    "A person reads it and finds the right room",
                    "Direct answers on scope and cost",
                    "One agreement, with a schedule per service",
                ],
            },
        ),
        (
            "spotlights",
            {
                "items": [
                    {
                        "eyebrow": "Academy · Short course",
                        "title": "EBM & Digital Invoicing Mastery",
                        "body": (
                            "Two weeks, four hands-on sessions. Leave able to issue a correct "
                            "EBM receipt, not just describe the process."
                        ),
                        "division": "academy",
                        "label": "See the course",
                        "href": "/academy/courses/ebm-digital-invoicing",
                    },
                    {
                        "eyebrow": "Advisory · In writing",
                        "title": "VAT and EBM returns filed two business days early",
                        "body": (
                            "A filing calendar you never have to chase, and a first response "
                            "within 4 business hours when an EBM fails."
                        ),
                        "division": "advisory",
                        "label": "Request a consultation",
                        "href": "/contact",
                    },
                    {
                        "eyebrow": "Tech · In writing",
                        "title": "A first response within 2 hours when a system we host goes down",
                        "body": (
                            "Software, systems and hosting built for how you work, with a 99% "
                            "monthly uptime target and a plain explanation of every system."
                        ),
                        "division": "tech",
                        "label": "Get systems that work",
                        "href": "/contact?service=tech",
                    },
                    {
                        "eyebrow": "Data · In writing",
                        "title": "Monthly reports and dashboards by the 5th business day",
                        "body": (
                            "Paper and spreadsheet records entered and cleaned into one format, "
                            "checked against a 99.5% accuracy target before delivery."
                        ),
                        "division": "data",
                        "label": "Get numbers you can trust",
                        "href": "/contact?service=data",
                    },
                ]
            },
        ),
        ("factStrip", {}),
        (
            "commitments",
            {
                "eyebrow": "The number first",
                "heading": "What we commit to, in writing",
                "items": [
                    {
                        "figure": "2 days",
                        "label": (
                            "VAT and EBM returns filed at least 2 business days before the deadline"
                        ),
                        "division": "advisory",
                    },
                    {
                        "figure": "4 hrs",
                        "label": (
                            "First response to an urgent compliance issue, such as an EBM failure"
                        ),
                        "division": "advisory",
                    },
                    {
                        "figure": "1 day",
                        "label": "First reply to a question about an Academy course",
                        "division": "academy",
                    },
                    {
                        "figure": "2 hrs",
                        "label": "First response when a system we host for you is down",
                        "division": "tech",
                    },
                    {
                        "figure": "99.5%",
                        "label": "Data accuracy target, verified by sample audit before delivery",
                        "division": "data",
                    },
                ],
                "note": (
                    "Targets from our client service agreements: commitments we are held to, "
                    "not past results."
                ),
            },
        ),
        (
            "pillars",
            {
                "eyebrow": "Why one company",
                # Messaging Framework level 1, the core philosophy.
                "heading": "One gate. Four rooms. No translation lost between them.",
                "intro": (
                    "A recommendation made in one room is already understood in the other "
                    "three, so you never brief four vendors on the same business."
                ),
                "items": [
                    {
                        "title": "Compliance certainty",
                        "body": (
                            "Tax, VAT, EBM and monthly books handled correctly and on time, with "
                            "straight answers about where you stand."
                        ),
                        "division": "advisory",
                    },
                    {
                        "title": "Practical skills",
                        "body": (
                            "Short courses that leave your team able to do the work, built from "
                            "real Advisory cases."
                        ),
                        "division": "academy",
                    },
                    {
                        "title": "Systems that work",
                        "body": (
                            "Software, systems and hosting built for how you work, explained in "
                            "plain language. Nothing shipped as a black box."
                        ),
                        "division": "tech",
                    },
                    {
                        "title": "Numbers you can trust",
                        "body": (
                            "The records you already keep, turned into reports that honestly "
                            "answer 'is this working?'"
                        ),
                        "division": "data",
                    },
                ],
            },
        ),
        (
            "marketFacts",
            {
                "eyebrow": "The problem",
                "heading": (
                    "Every sale needs an EBM receipt, and most small businesses find that hard."
                ),
                "items": [
                    {
                        "figure": "59%",
                        "statement": (
                            "of Rwandan SMEs report difficulty operating their Electronic "
                            "Billing Machine (EBM)"
                        ),
                    },
                    {"figure": "51%", "statement": "cite affordability as a barrier"},
                ],
                "source": (
                    "Peer-reviewed EBM/VAT compliance studies of Rwandan SMEs, as cited in "
                    "Z-GATE's 90-Day Business Plan (August 2026)."
                ),
            },
        ),
        (
            "audiences",
            {
                "eyebrow": "Who we work with",
                "heading": "Built for the people who run the business",
                "items": [
                    {
                        "tab": "Shop owners & traders",
                        "headline": "Your EBM and VAT, handled before they become a problem.",
                        "body": (
                            "When an EBM fails or a VAT deadline is close, you need a straight "
                            "answer, not a hedge. Advisory keeps your filings, receipts and books "
                            "on schedule."
                        ),
                        "points": [
                            "EBM setup and ongoing compliance checks",
                            "VAT and income tax returns filed early",
                            "Monthly books closed by the 5th business day",
                        ],
                        "division": "advisory",
                        "label": "How we help traders",
                        "href": "/solutions/traders-and-shops",
                    },
                    {
                        "tab": "Growing firms",
                        "headline": "One relationship instead of four vendors.",
                        "body": (
                            "Books, systems and reporting handled by teams that already talk to "
                            "each other, so you stop translating between providers."
                        ),
                        "points": [
                            "One master agreement, a schedule per service",
                            "Advisory, Tech and Data share context",
                            "Anything outside scope quoted before work starts",
                        ],
                        "division": "bundle",
                        "label": "How one relationship works",
                        "href": "/solutions/growing-businesses",
                    },
                    {
                        "tab": "Owners & their staff",
                        "headline": "The tax, bookkeeping and EBM skills your business needs next.",
                        "body": (
                            "Short, in-person courses built from real Advisory cases. Who it's "
                            "for, length and fee are stated before you sign up."
                        ),
                        "points": [
                            "Two to four weeks, 1.5-hour sessions",
                            "No accounting background needed",
                            "Taught in person in Nyarugenge",
                        ],
                        "division": "academy",
                        "label": "Skills for your team",
                        "href": "/solutions/skills-for-your-team",
                    },
                    {
                        "tab": "NGOs & data-rich teams",
                        "headline": "A clear answer from the records you already keep.",
                        "body": (
                            "Paper and spreadsheet records entered, cleaned and turned into "
                            "regular reports and dashboards you can act on."
                        ),
                        "points": [
                            "Records processed within 3 business days",
                            "Monthly report by the 5th business day",
                            "99.5% accuracy target, checked by sample audit",
                        ],
                        "division": "data",
                        "label": "How we help NGOs",
                        "href": "/solutions/ngos-and-data-teams",
                    },
                ],
            },
        ),
        (
            "scenarios",
            {
                "eyebrow": "Situations we handle",
                "heading": "What working with Z-GATE looks like",
                "items": [
                    {
                        "situation": "The EBM stops issuing receipts",
                        "response": (
                            "We pick it up within 4 business hours and work through it with you "
                            "until your receipts are compliant again."
                        ),
                        "figure": "4 hrs",
                        "figure_label": "first response to an urgent compliance issue",
                        "division": "advisory",
                    },
                    {
                        "situation": "The VAT deadline is next week",
                        "response": (
                            "Monthly bookkeeping keeps your records current, so returns go in at "
                            "least two business days before the deadline."
                        ),
                        "figure": "2 days",
                        "figure_label": "returns filed before the deadline",
                        "division": "advisory",
                    },
                    {
                        "situation": "Staff aren't sure how to use the EBM",
                        "response": (
                            "The EBM course is four hands-on sessions over two weeks, built to "
                            "leave them able to issue a correct receipt."
                        ),
                        "figure": "1 day",
                        "figure_label": "first reply to a course question",
                        "division": "academy",
                    },
                    {
                        "situation": "A system you depend on goes down",
                        "response": (
                            "For systems we host, a first response within 2 hours of a critical "
                            "outage, and a plain explanation of what happened."
                        ),
                        "figure": "2 hrs",
                        "figure_label": "first response to a critical outage",
                        "division": "tech",
                    },
                    {
                        "situation": "Records everywhere, no clear picture",
                        "response": (
                            "We enter and clean your records into one format, then deliver "
                            "reports on an agreed schedule."
                        ),
                        "figure": "3 days",
                        "figure_label": "standard data processing turnaround",
                        "division": "data",
                    },
                ],
                "note": (
                    "Typical requests and the written commitments that apply to them: not client "
                    "case studies."
                ),
            },
        ),
        (
            "trust",
            {
                "eyebrow": "Check before you call",
                "heading": "Facts you can verify",
                "items": [
                    {
                        "title": "A registered company",
                        "body": "Z-GATE LTD is registered in Rwanda.",
                    },
                    {
                        "title": "Licensed tax representation",
                        "body": (
                            "Representation before the Rwanda Revenue Authority is our licensed "
                            "main business activity."
                        ),
                    },
                    {
                        "title": "Your data stays in Rwanda",
                        "body": (
                            "Personal data is stored in Rwanda by default, under Law N° 058/2021."
                        ),
                    },
                    {
                        "title": "Commitments in writing",
                        "body": (
                            "Our response and delivery targets come from our client service "
                            "agreements, not from marketing."
                        ),
                    },
                ],
                "link": {"label": "About Z-GATE", "href": "/about"},
            },
        ),
        (
            "latest",
            {
                "eyebrow": "What's new",
                "heading": "Courses and insights",
            },
        ),
        (
            "steps",
            {
                "eyebrow": "How it works",
                "heading": "From first message to one agreement",
                "items": [
                    {
                        "title": "Tell us what you need",
                        "body": (
                            "Message us on WhatsApp, call or email. A short description is enough."
                        ),
                    },
                    {
                        "title": "Talk to a person",
                        "body": (
                            "Someone from Z-GATE replies personally and works out which "
                            "division fits."
                        ),
                    },
                    {
                        "title": "Get direct answers",
                        "body": (
                            "We go through your situation plainly, including what's in scope "
                            "and what it costs."
                        ),
                    },
                    {
                        "title": "Sign one agreement",
                        "body": (
                            "One master agreement, with a schedule for each service you choose. "
                            "Anything outside it is quoted before work starts."
                        ),
                    },
                ],
            },
        ),
        (
            "callToAction",
            {
                "eyebrow": "Talk to us",
                "heading": "Let's talk about your business",
                "body": "A real person will reply, not an automated response.",
                **cta,
            },
        ),
    ]


def about_layout() -> list[tuple[str, dict[str, Any]]]:
    c = COPY
    return [
        (
            "hero",
            {
                "eyebrow": f"About {c['company']['tradingName']}",
                # Messaging Framework level 1, the core philosophy.
                "headline": "One gate. Four rooms. No translation lost between them.",
                "lede": c["aboutLongForm"][0],
            },
        ),
        (
            "richText",
            {
                "eyebrow": "Why one company",
                "heading": "Both sides of the gate, under one roof",
                "content": paragraphs(*c["aboutLongForm"][1:]),
            },
        ),
        (
            "featureList",
            {
                "eyebrow": "Where we're going",
                "heading": "Mission and vision",
                "items": [
                    {"title": "Mission", "body": c["mission"]},
                    {"title": "Vision", "body": c["vision"]},
                ],
            },
        ),
        (
            "featureList",
            {
                "eyebrow": "What we hold to",
                "heading": "Values",
                "numbered": True,
                "items": c["values"],
            },
        ),
        ("factStrip", {"heading": "Company facts"}),
        # Every marketing page ends with a next step (SitePage.clean).
        ("callToAction", {"heading": "Ready to talk?", **_primary_cta()}),
    ]


def contact_layout() -> list[tuple[str, dict[str, Any]]]:
    return [
        (
            "hero",
            {
                "eyebrow": "Contact",
                "headline": "Talk to a person at Z-GATE",
                "lede": (
                    "Tell us what you need — a real person will follow up, not an "
                    "automated response."
                ),
            },
        ),
        (
            "steps",
            {
                "heading": "What happens next",
                "items": [
                    {
                        "title": "You send a message",
                        "body": (
                            "On WhatsApp, by phone, by email or with the form. A few lines "
                            "are enough."
                        ),
                    },
                    {
                        "title": "We reply personally",
                        "body": "Someone from Z-GATE answers on the channel you used.",
                    },
                    {
                        "title": "We find the right room",
                        "body": (
                            "We work out which of our four divisions fits your need, and the "
                            "next step."
                        ),
                    },
                ],
            },
        ),
        ("leadForm", {"variant": "contact", "heading": "Send us a message"}),
    ]


# ------------------------------------------------------------ solutions
#
# One page per kind of business we serve (docs/CONTENT_GUIDE.md §2), each
# bringing together what the four divisions do for it. Commitments and
# answers are looked up from the approved division copy, never retyped, so
# they can't drift from what was approved.


def _division(slug: str) -> dict[str, Any]:
    return next(d for d in COPY["divisions"] if d["slug"] == slug)


def _commitments(*picks: tuple[str, str]) -> list[dict[str, str]]:
    """Approved commitments by (division, figure), with the division's colour."""
    items = []
    for slug, figure in picks:
        found = next(c for c in _division(slug)["commitments"] if c["figure"] == figure)
        items.append({"figure": found["figure"], "label": found["label"], "division": slug})
    return items


def _answers(*picks: tuple[str, str]) -> list[dict[str, str]]:
    """Approved questions and answers (FAQ or objection) by (division, question)."""
    items = []
    for slug, question in picks:
        division = _division(slug)
        pool = [*division["faq"], division["objection"]]
        items.append(next(q for q in pool if q["question"] == question))
    return items


def _talk(heading: str, body: str, label: str, href: str) -> tuple[str, dict[str, Any]]:
    """The closing call to action every marketing page needs (SitePage.clean)."""
    block = {"eyebrow": "Talk to us", "heading": heading, "body": body}
    return ("callToAction", {**block, "label": label, "href": href})


def solutions_layout() -> list[tuple[str, dict[str, Any]]]:
    return [
        (
            "hero",
            {
                "eyebrow": "Solutions",
                "headline": "Start from your business, not from our list of services.",
                "lede": (
                    "Each page brings together what Advisory, Academy, Tech and Data do for a "
                    "business like yours, with the written commitments that apply. Or start from "
                    "what you need right now."
                ),
            },
        ),
        (
            "solutionGrid",
            {
                "eyebrow": "By kind of business",
                "heading": "Who we work with",
            },
        ),
        (
            "doors",
            {
                "eyebrow": "By need",
                "heading": "What do you need help with?",
                "items": [
                    {
                        "need": "My EBM keeps failing, or my receipts aren't right",
                        "answer": (
                            "Advisory sets up your EBM and checks your receipts stay compliant, "
                            "with a first response within 4 business hours when it fails."
                        ),
                        "division": "advisory",
                        "label": "Go to Advisory",
                        "href": "/advisory",
                    },
                    {
                        "need": "A VAT or income tax deadline is coming",
                        "answer": (
                            "Returns prepared and filed for you, at least 2 business days before "
                            "the deadline."
                        ),
                        "division": "advisory",
                        "label": "Request a consultation",
                        "href": "/contact?service=advisory",
                    },
                    {
                        "need": "My staff need tax, bookkeeping or EBM skills",
                        "answer": (
                            "Short, in-person courses built from real Advisory cases. No "
                            "accounting background needed."
                        ),
                        "division": "academy",
                        "label": "See the courses",
                        "href": "/academy/courses",
                    },
                    {
                        "need": "We need software, or our systems keep letting us down",
                        "answer": (
                            "Software and systems built and maintained for how you work, "
                            "explained in plain language."
                        ),
                        "division": "tech",
                        "label": "Go to Tech",
                        "href": "/tech",
                    },
                    {
                        "need": "We have records but no clear picture",
                        "answer": (
                            "Records entered, cleaned and turned into regular reports and "
                            "dashboards you can act on."
                        ),
                        "division": "data",
                        "label": "Go to Data",
                        "href": "/data",
                    },
                    {
                        "need": "I'm not sure what we need",
                        "answer": (
                            "Tell us what's going on. A person reads every message and points "
                            "you to the right team."
                        ),
                        "division": "bundle",
                        "label": "Start Now",
                        "href": "/contact",
                    },
                ],
            },
        ),
        _talk(
            "Not sure where you fit?",
            "A real person will reply, not an automated response.",
            "Start Now",
            "/contact",
        ),
    ]


def traders_layout() -> list[tuple[str, dict[str, Any]]]:
    advisory = _division("advisory")
    return [
        (
            "hero",
            {
                "eyebrow": "Solutions · Traders and shops",
                "headline": (
                    "Your EBM receipts, VAT and books, handled before they become a problem."
                ),
                "lede": (
                    "For traders and small businesses: EBM setup and checks, VAT and income tax "
                    "returns filed early, and monthly books that are always current. From "
                    "Z-GATE Advisory, licensed for tax representation before the RRA."
                ),
                "cta": {"label": "Request a consultation", "href": "/contact?service=advisory"},
            },
        ),
        (
            "marketFacts",
            {
                "eyebrow": "You're not the only one",
                "heading": (
                    "Every sale needs an EBM receipt, and most small businesses find that hard."
                ),
                "items": [
                    {
                        "figure": "59%",
                        "statement": (
                            "of Rwandan SMEs report difficulty operating their Electronic "
                            "Billing Machine (EBM)"
                        ),
                    },
                    {"figure": "51%", "statement": "cite affordability as a barrier"},
                ],
                "source": (
                    "Peer-reviewed EBM/VAT compliance studies of Rwandan SMEs, as cited in "
                    "Z-GATE's 90-Day Business Plan (August 2026)."
                ),
            },
        ),
        (
            "featureList",
            {
                "eyebrow": "What we take off your plate",
                "heading": "Compliance you don't have to chase",
                "items": [
                    {"title": "EBM set up and kept compliant", "body": advisory["included"][2]},
                    {
                        "title": "Returns prepared and filed for you",
                        "body": (
                            "VAT, and personal and business income tax returns, filed at least "
                            "2 business days before the deadline."
                        ),
                    },
                    {
                        "title": "Books closed every month",
                        "body": (
                            "Monthly bookkeeping, closed and reconciled by the 5th business day "
                            "of the next month, so a deadline never finds you without records."
                        ),
                    },
                    {
                        "title": "Your staff able to run the EBM",
                        "body": (
                            "Z-GATE Academy's EBM course: four hands-on sessions over two weeks, "
                            "built to leave them able to issue a correct receipt."
                        ),
                    },
                ],
            },
        ),
        (
            "commitments",
            {
                "eyebrow": "The number first",
                "heading": "What we commit to, in writing",
                "items": _commitments(
                    ("advisory", "2 days"),
                    ("advisory", "4 hrs"),
                    ("advisory", "5th"),
                    ("advisory", "Same day"),
                ),
            },
        ),
        (
            "faq",
            {
                "eyebrow": "Straight answers",
                "heading": "Before you ask",
                "items": _answers(
                    ("advisory", "Can I afford ongoing help?"),
                    ("advisory", "Is Z-GATE a real, licensed company?"),
                    ("advisory", "What if I need something that isn't in my agreement?"),
                ),
            },
        ),
        _talk(
            "Tell us what's happening with your receipts or returns",
            "A real person from Advisory will reply, not an automated response.",
            "Request a consultation",
            "/contact?service=advisory",
        ),
    ]


def growing_layout() -> list[tuple[str, dict[str, Any]]]:
    c = COPY
    threshold = next(v for v in c["values"] if v["title"] == "Threshold, not silo")
    return [
        (
            "hero",
            {
                "eyebrow": "Solutions · Growing businesses",
                "headline": "One relationship for your books, your systems and your reporting.",
                "lede": (
                    "Most businesses hire a tax consultant, a trainer, a developer and a data "
                    "analyst separately, then spend their time translating between them. Z-GATE "
                    "puts all four under one roof: one agreement, with a schedule for each "
                    "service you choose."
                ),
                "cta": c["primaryCta"],
            },
        ),
        (
            "featureList",
            {
                "eyebrow": "One gate, four rooms",
                "heading": "What one relationship covers",
                "items": [
                    {
                        "title": "Compliance and books: Advisory",
                        "body": (
                            "Tax representation before the RRA, VAT and EBM, monthly "
                            "bookkeeping, and business and management advice when you need it."
                        ),
                    },
                    {
                        "title": "Skills for your team: Academy",
                        "body": (
                            "Short, practical courses in tax, bookkeeping and EBM, built from "
                            "real, anonymized Advisory cases."
                        ),
                    },
                    {
                        "title": "Systems that work: Tech",
                        "body": (
                            "Software and systems built and maintained for how you work, and "
                            "your computers looked after, onsite or remotely."
                        ),
                    },
                    {
                        "title": "Numbers you can trust: Data",
                        "body": (
                            "Regular reports and dashboards on an agreed schedule, built on your "
                            "real financial, training and system data."
                        ),
                    },
                ],
            },
        ),
        (
            "featureList",
            {
                "eyebrow": "Why it works",
                "heading": "You brief one team, not four",
                "numbered": True,
                "items": [
                    threshold,
                    {
                        "title": "One agreement",
                        "body": (
                            "One master agreement, with a schedule for each service you choose. "
                            "Anything outside it is quoted before work starts."
                        ),
                    },
                ],
            },
        ),
        (
            "commitments",
            {
                "eyebrow": "The number first",
                "heading": "What we commit to, in writing",
                "items": _commitments(
                    ("advisory", "2 days"),
                    ("tech", "2 hrs"),
                    ("tech", "99%"),
                    ("data", "5th"),
                    ("data", "99.5%"),
                ),
            },
        ),
        (
            "faq",
            {
                "eyebrow": "Straight answers",
                "heading": "Before you ask",
                "items": [
                    {
                        "question": "Why a newer company over an established one?",
                        "answer": (
                            "We won't claim to be better than anyone. What we offer is one "
                            "relationship across compliance, skills, systems and data, so you "
                            "brief one team instead of four."
                        ),
                    },
                    *_answers(
                        ("tech", "Do you have external Tech clients yet?"),
                        ("advisory", "What if I need something that isn't in my agreement?"),
                    ),
                ],
            },
        ),
        _talk(
            "Bring your vendors under one roof",
            "Tell us what you run on today. A real person will reply, not an automated response.",
            c["primaryCta"]["label"],
            c["primaryCta"]["href"],
        ),
    ]


def data_teams_layout() -> list[tuple[str, dict[str, Any]]]:
    data = _division("data")
    return [
        (
            "hero",
            {
                "eyebrow": "Solutions · NGOs and data-rich teams",
                "headline": "A clear answer to “is this working”, from the records you keep.",
                "lede": (
                    "For NGOs and businesses with records on paper, in spreadsheets or in "
                    "systems, but no clear picture of what they show. Z-GATE Data enters and "
                    "cleans them into one format, then reports on an agreed schedule."
                ),
                "cta": {"label": "Start Now", "href": "/contact?service=data"},
            },
        ),
        (
            "featureList",
            {
                "eyebrow": "What we take off your plate",
                "heading": "From scattered records to a report you can act on",
                "items": [
                    {"title": "Records entered and cleaned", "body": data["included"][0]},
                    {"title": "Reports and dashboards on schedule", "body": data["included"][1]},
                    {"title": "Analysis when you need an answer", "body": data["included"][2]},
                    {
                        "title": "Shared only where it's safe",
                        "body": (
                            "Reports are shared only through access-controlled channels, never "
                            "open links or unsecured email."
                        ),
                    },
                ],
            },
        ),
        (
            "commitments",
            {
                "eyebrow": "The number first",
                "heading": "What we commit to, in writing",
                "items": _commitments(
                    ("data", "3 days"), ("data", "5th"), ("data", "99.5%"), ("data", "1 day")
                ),
            },
        ),
        (
            "faq",
            {
                "eyebrow": "Straight answers",
                "heading": "Before you ask",
                "items": _answers(
                    ("data", "Will my data be mixed with anyone else's?"),
                    ("data", "Where is our data kept?"),
                ),
            },
        ),
        _talk(
            "Tell us what records you have",
            "A real person from Data will reply, not an automated response.",
            "Start Now",
            "/contact?service=data",
        ),
    ]


def skills_layout() -> list[tuple[str, dict[str, Any]]]:
    return [
        (
            "hero",
            {
                "eyebrow": "Solutions · Skills for your team",
                "headline": "The tax, bookkeeping and EBM skills your business needs next.",
                "lede": (
                    "Short, in-person courses for business owners and their staff, built from "
                    "real, anonymized Advisory cases. Who it's for, length, schedule and fee are "
                    "stated before you sign up, and no accounting background is needed."
                ),
                "cta": {"label": "See the courses", "href": "/academy/courses"},
            },
        ),
        ("courseList", {"eyebrow": "Z-GATE Academy", "heading": "Courses", "courses": []}),
        (
            "featureList",
            {
                "eyebrow": "Why it's practical",
                "heading": "A capability the business can point to",
                "items": [
                    {
                        "title": "Built from real cases",
                        "body": (
                            "Every course comes from the tax, bookkeeping and EBM problems small "
                            "businesses actually bring to Advisory."
                        ),
                    },
                    {
                        "title": "Short by design",
                        "body": (
                            "Two to four weeks of 1.5-hour sessions, taught in person in "
                            "Nyarugenge."
                        ),
                    },
                    {
                        "title": "Or hand it over",
                        "body": (
                            "If you'd rather not do it yourself, Z-GATE Advisory can file your "
                            "returns and keep your books for you."
                        ),
                    },
                ],
            },
        ),
        (
            "commitments",
            {
                "eyebrow": "The number first",
                "heading": "What we commit to, in writing",
                "items": _commitments(("academy", "1 day"), ("academy", "2 days")),
            },
        ),
        (
            "faq",
            {
                "eyebrow": "Straight answers",
                "heading": "Before you ask",
                "items": _answers(
                    ("academy", "Is this just theory?"),
                    ("academy", "Where and how do the courses run?"),
                ),
            },
        ),
        _talk(
            "Find the course for your team",
            "Each course page says exactly what you'll be able to do by the end.",
            "See the courses",
            "/academy/courses",
        ),
    ]


def privacy_layout() -> list[tuple[str, dict[str, Any]]]:
    """
    Seeded as a DRAFT and never published by the seed: the wording must
    come from the DPO / legal counsel (Law N° 058/2021). The bracketed
    lines are deliberately unfinished.
    """
    html = "".join(
        f"<h2>{escape(s['heading'])}</h2><p>{escape(s['body'])}</p>"
        for s in COPY["privacySkeleton"]
    )
    return [("hero", {"headline": "Privacy notice"}), ("richText", {"content": html})]


PAGES = [
    {
        "title": "Home",
        "slug": "home",
        "page_type": "marketing",
        "publish": True,
        "seo_title": "Z-GATE Solution — Tax, EBM, Training, Tech & Data in Kigali",
        "search_description": (
            "Stop juggling four vendors: tax and EBM compliance, practical training, systems and "
            "data reporting, under one roof in Kigali."
        ),
        "layout": home_layout,
    },
    {
        "title": "About",
        "slug": "about",
        "page_type": "marketing",
        "publish": True,
        "seo_title": "About Z-GATE Solution — One gate, four rooms",
        "search_description": (
            "Why Z-GATE runs Advisory, Academy, Tech and Data as one company: our mission, "
            "vision, values and registration details."
        ),
        "layout": about_layout,
    },
    {
        "title": "Contact",
        "slug": "contact",
        "page_type": "marketing",
        "publish": True,
        "seo_title": "Contact Z-GATE — WhatsApp, phone or email",
        "search_description": (
            "Talk to a person at Z-GATE in Kiyovu, Kigali, by WhatsApp, phone or email. Tell us "
            "what you need and we'll find the right division."
        ),
        "layout": contact_layout,
    },
    {
        "title": "Solutions",
        "slug": "solutions",
        "page_type": "marketing",
        "publish": True,
        "seo_title": "Solutions by kind of business — Z-GATE, Kigali",
        "search_description": (
            "Tax and EBM compliance, training, systems and data, brought together for traders, "
            "growing businesses, NGOs and teams building skills."
        ),
        "layout": solutions_layout,
    },
    {
        "title": "Traders and shops",
        "slug": "traders-and-shops",
        "parent": "solutions",
        "page_type": "solution",
        "publish": True,
        "seo_title": "EBM, VAT & bookkeeping for traders in Kigali — Z-GATE",
        "search_description": (
            "EBM setup and checks, VAT and income tax returns filed early, and monthly books "
            "that are always current."
        ),
        "layout": traders_layout,
    },
    {
        "title": "Growing businesses",
        "slug": "growing-businesses",
        "parent": "solutions",
        "page_type": "solution",
        "publish": True,
        "seo_title": "One partner for tax, systems & reporting — Z-GATE",
        "search_description": (
            "One relationship for your books, your systems and your reporting, instead of four "
            "separate vendors."
        ),
        "layout": growing_layout,
    },
    {
        "title": "NGOs and data-rich teams",
        "slug": "ngos-and-data-teams",
        "parent": "solutions",
        "page_type": "solution",
        "publish": True,
        "seo_title": "Data processing & reporting for NGOs in Rwanda — Z-GATE",
        "search_description": (
            "Paper and spreadsheet records entered, cleaned and turned into reports and "
            "dashboards that answer “is this working”."
        ),
        "layout": data_teams_layout,
    },
    {
        "title": "Skills for your team",
        "slug": "skills-for-your-team",
        "parent": "solutions",
        "page_type": "solution",
        "publish": True,
        "seo_title": "Tax, bookkeeping & EBM training in Kigali — Z-GATE",
        "search_description": (
            "Short, in-person courses for owners and staff, built from real Advisory cases. No "
            "accounting background needed."
        ),
        "layout": skills_layout,
    },
    {
        "title": "Privacy notice",
        "slug": "privacy",
        "page_type": "legal",
        "publish": False,
        "seo_title": "",
        "search_description": "",
        "layout": privacy_layout,
    },
]


# ---------------------------------------------------------------- demos
#
# Placeholders for the Demo Library (/demos): one walkthrough per thing a
# client asks to see, each from approved facts and commitments only. None
# has a video yet, so the website shows each as "Coming soon" and offers a
# live walkthrough instead. Add the video link in the CMS once one is
# recorded. `audiences` are solution page slugs.

DEMOS: list[dict[str, Any]] = [
    {
        "slug": "ebm-setup-and-receipt-checks",
        "title": "EBM setup and receipt checks",
        "summary": (
            "How Advisory sets up your EBM and checks that every receipt stays compliant, "
            "and what happens in the first 4 business hours when it fails."
        ),
        "division": "advisory",
        "audiences": ["traders-and-shops"],
    },
    {
        "slug": "vat-and-income-tax-filing-calendar",
        "title": "Your VAT and income tax filing calendar",
        "summary": (
            "How returns are prepared and filed at least 2 business days before each "
            "deadline, so you never have to chase one."
        ),
        "division": "advisory",
        "audiences": ["traders-and-shops", "growing-businesses"],
    },
    {
        "slug": "closing-your-books-every-month",
        "title": "Closing your books every month",
        "summary": ("From receipts to reconciled books by the 5th business day of the next month."),
        "division": "advisory",
        "audiences": ["traders-and-shops", "growing-businesses"],
    },
    {
        "slug": "inside-the-ebm-course",
        "title": "Inside the EBM & Digital Invoicing course",
        "summary": (
            "A look at the four hands-on sessions that leave your staff able to issue a "
            "correct EBM receipt."
        ),
        "division": "academy",
        "audiences": ["skills-for-your-team", "traders-and-shops"],
    },
    {
        "slug": "tax-and-bookkeeping-session-preview",
        "title": "Tax & Bookkeeping Fundamentals: a session preview",
        "summary": (
            "How a session works: real, anonymized Advisory cases instead of generic slides."
        ),
        "division": "academy",
        "audiences": ["skills-for-your-team"],
    },
    {
        "slug": "a-system-built-for-how-you-work",
        "title": "A system built for how you work",
        "summary": (
            "From the first conversation to handover: how Tech designs, builds and explains "
            "a system, so nothing is a black box."
        ),
        "division": "tech",
        "audiences": ["growing-businesses"],
    },
    {
        "slug": "hosting-and-support-when-something-goes-down",
        "title": "Hosting and support when something goes down",
        "summary": (
            "What happens after a critical outage on a system we host: a first response "
            "within 2 hours, and a plain explanation of what happened."
        ),
        "division": "tech",
        "audiences": ["growing-businesses"],
    },
    {
        "slug": "from-paper-records-to-a-monthly-dashboard",
        "title": "From paper records to a monthly dashboard",
        "summary": (
            "How Data enters and cleans your records into one format, then delivers your "
            "report by the 5th business day."
        ),
        "division": "data",
        "audiences": ["ngos-and-data-teams", "growing-businesses"],
    },
    {
        "slug": "accurate-reports-shared-safely",
        "title": "Accurate reports, shared safely",
        "summary": (
            "How each delivery is checked against a 99.5% accuracy target and shared only "
            "through access-controlled channels."
        ),
        "division": "data",
        "audiences": ["ngos-and-data-teams"],
    },
    {
        "slug": "one-relationship-four-teams",
        "title": "One relationship, four teams",
        "summary": (
            "How Advisory, Academy, Tech and Data share what they learn about your "
            "business, under one agreement."
        ),
        "division": "bundle",
        "audiences": ["growing-businesses"],
    },
]
