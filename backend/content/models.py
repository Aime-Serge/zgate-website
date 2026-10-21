"""
The website's content. Pages are Wagtail pages built from blocks;
divisions, courses and articles are snippets with drafts, revisions and a
publish permission (editors draft, publishers publish - accounts/roles.py);
company facts and contact details are Site settings.

Wagtail keeps a published object's live content in its own row and drafts
in revisions, so the public API (content/views.py) reads `live` rows only:
a draft can never leak through a missed filter.
"""

from __future__ import annotations

from urllib.parse import urlsplit

from django import forms
from django.contrib.contenttypes.fields import GenericRelation
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import F, Q
from django.http import Http404, HttpRequest, HttpResponse
from modelcluster.fields import ParentalKey, ParentalManyToManyField
from modelcluster.models import ClusterableModel
from wagtail.admin.panels import (
    FieldPanel,
    FieldRowPanel,
    InlinePanel,
    MultiFieldPanel,
    ObjectList,
    PublishingPanel,
    TabbedInterface,
)
from wagtail.contrib.settings.models import BaseGenericSetting, register_setting
from wagtail.fields import RichTextField, StreamField
from wagtail.models import (
    DraftStateMixin,
    LockableMixin,
    Orderable,
    Page,
    RevisionMixin,
)
from wagtail.search import index

from content.blocks import NEXT_STEP_BLOCKS, PAGE_BLOCKS, RICH_TEXT_FEATURES
from content.validators import (
    DIVISION_CHOICES,
    DIVISION_SLUGS,
    RESERVED_PAGE_SLUGS,
    validate_href,
    validate_https_url,
    validate_slug,
)

SEARCH_TITLE_HELP = "Shown in search results (about 60 characters). Defaults to the page title."
SEARCH_DESCRIPTION_HELP = "Shown under the title in search results (about 160 characters)."


class SeoFields(models.Model):
    seo_title = models.CharField(
        "search title", max_length=60, blank=True, help_text=SEARCH_TITLE_HELP
    )
    seo_description = models.TextField(
        "search description", max_length=160, blank=True, help_text=SEARCH_DESCRIPTION_HELP
    )

    class Meta:
        abstract = True

    seo_panels = [
        MultiFieldPanel(
            [FieldPanel("seo_title"), FieldPanel("seo_description")], heading="Search & sharing"
        )
    ]


class Revisioned(DraftStateMixin, LockableMixin, RevisionMixin, ClusterableModel):
    """Drafts, locking and revision history for a snippet (Wagtail's pattern)."""

    _revisions = GenericRelation(
        "wagtailcore.Revision", related_query_name="%(app_label)s_%(class)s"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

    @property
    def revisions(self):
        return self._revisions


# ---------------------------------------------------------------- pages


PAGE_TYPES = [
    ("marketing", "Marketing"),
    ("solution", "Solution (one kind of business, shown under /solutions)"),
    ("legal", "Legal (privacy, terms)"),
]


class SitePage(Page):
    """
    A site page (home, about, contact, privacy...). The slug "home" is the
    homepage. Solution pages - one per kind of business we serve - are
    published at /solutions/<slug> and listed on the page with slug
    "solutions" and in the site menu.
    """

    PAGE_TYPES = PAGE_TYPES

    page_type = models.CharField(max_length=20, choices=PAGE_TYPES, default="marketing")
    layout = StreamField(PAGE_BLOCKS)

    content_panels = [*Page.content_panels, FieldPanel("page_type"), FieldPanel("layout")]
    promote_panels = [
        MultiFieldPanel(
            [FieldPanel("slug"), FieldPanel("seo_title"), FieldPanel("search_description")],
            heading="URL & search",
        )
    ]
    parent_page_types = ["wagtailcore.Page", "content.SitePage"]
    subpage_types = ["content.SitePage"]
    # Headless: the Next.js site renders pages, so Wagtail neither previews
    # nor serves them.
    preview_modes: list[tuple[str, str]] = []

    class Meta:
        verbose_name = "site page"
        constraints = [
            models.CheckConstraint(
                condition=Q(page_type__in=[t for t, _ in PAGE_TYPES]),
                name="sitepage_page_type_valid",
            )
        ]

    def clean(self) -> None:
        super().clean()
        # The public site finds a page by its slug alone, so the slug is its
        # address: it must be unique across the site, not only among siblings.
        if self.slug in RESERVED_PAGE_SLUGS:
            raise ValidationError({"slug": f"/{self.slug} is already used by the website."})
        if SitePage.objects.exclude(pk=self.pk).filter(slug=self.slug).exists():
            raise ValidationError({"slug": "Another page already uses this address."})
        if self.page_type == "solution":
            if self.slug == "solutions":
                raise ValidationError({"slug": "/solutions is the page that lists solutions."})
            if not self.search_description:
                raise ValidationError(
                    {
                        "search_description": (
                            "Solution pages need a search description: it is also their "
                            "summary in the menu and on the Solutions page."
                        )
                    }
                )
        if self.page_type == "legal":
            return
        types = {block.block_type for block in self.layout}
        if not types & NEXT_STEP_BLOCKS:
            raise ValidationError(
                {
                    "layout": (
                        "Marketing pages need a Call to action or a form block so visitors "
                        "have a next step."
                    )
                }
            )

    def serve(self, request: HttpRequest, *args: object, **kwargs: object) -> HttpResponse:
        raise Http404("Pages are rendered by the public website, not the CMS.")


# ------------------------------------------------------------ divisions


class Division(SeoFields, Revisioned):
    """
    The four divisions. A fixed structure rather than free-form blocks: who
    it's for -> what's included -> commitments as figures -> honest answers
    -> the other three rooms -> call to action, the site's strongest
    content sequence (v1 commercial review).
    """

    slug = models.CharField(
        max_length=20, choices=DIVISION_CHOICES, unique=True, help_text="Also the page URL."
    )
    order = models.PositiveSmallIntegerField(default=0)
    name = models.CharField(max_length=60)
    short_name = models.CharField(max_length=30)
    subtitle = models.CharField(
        max_length=60,
        blank=True,
        help_text='The brand guide\'s line, e.g. "Tax & Business Consulting".',
    )
    pillar = models.CharField(
        max_length=40,
        blank=True,
        help_text='Its message-house pillar, e.g. "Compliance certainty".',
    )
    headline = models.CharField(
        max_length=140,
        blank=True,
        help_text=(
            "The page's main heading: the division's approved message "
            "(MESSAGING_FRAMEWORK level 4)."
        ),
    )
    mission = models.TextField(max_length=400)
    about = models.TextField(max_length=1200)
    audience = models.TextField(
        max_length=300, blank=True, help_text="Who it's for, in one or two plain sentences."
    )
    proof = models.TextField(
        max_length=800, help_text="Real, checkable commitments only. No invented results."
    )
    objection_question = models.CharField(
        "first question", max_length=200, help_text="The question this division's buyers ask first."
    )
    objection_answer = models.TextField("answer", max_length=800)
    cta_label = models.CharField("button label", max_length=60)
    cta_href = models.CharField("button link", max_length=500, validators=[validate_href])

    panels = [
        FieldRowPanel([FieldPanel("name"), FieldPanel("short_name")]),
        FieldRowPanel([FieldPanel("subtitle"), FieldPanel("pillar")]),
        FieldPanel("headline"),
        FieldPanel("mission"),
        FieldPanel("about"),
        FieldPanel("audience"),
        InlinePanel("included_items", label="What's included", min_num=1),
        FieldPanel("proof"),
        InlinePanel(
            "commitment_items",
            label="Commitments (SLA schedule targets - never past results)",
            max_num=6,
        ),
        MultiFieldPanel(
            [FieldPanel("objection_question"), FieldPanel("objection_answer")],
            heading="First question",
        ),
        InlinePanel("faq_items", label="More questions (honest answers only)", max_num=6),
        FieldRowPanel([FieldPanel("cta_label"), FieldPanel("cta_href")]),
        *SeoFields.seo_panels,
        MultiFieldPanel([FieldPanel("slug"), FieldPanel("order")], heading="Settings"),
        PublishingPanel(),
    ]

    class Meta:
        ordering = ["order"]
        verbose_name = "division"
        constraints = [
            # The four rooms are fixed: the router knows exactly these slugs.
            models.CheckConstraint(condition=Q(slug__in=DIVISION_SLUGS), name="division_slug_valid")
        ]

    def __str__(self) -> str:
        return self.name


class DivisionIncluded(Orderable):
    division = ParentalKey(Division, on_delete=models.CASCADE, related_name="included_items")
    item = models.CharField(max_length=240)

    panels = [FieldPanel("item")]


class DivisionCommitment(Orderable):
    division = ParentalKey(Division, on_delete=models.CASCADE, related_name="commitment_items")
    figure = models.CharField(max_length=16)
    label = models.CharField(max_length=140)

    panels = [FieldRowPanel([FieldPanel("figure"), FieldPanel("label")])]


class DivisionQuestion(Orderable):
    division = ParentalKey(Division, on_delete=models.CASCADE, related_name="faq_items")
    question = models.CharField(max_length=200)
    answer = models.TextField(max_length=800)

    panels = [FieldPanel("question"), FieldPanel("answer")]


# -------------------------------------------------------------- courses


class Course(SeoFields, index.Indexed, Revisioned):
    """
    Course pages are the gate to the e-learning platform, not the
    classroom (ADR-007): what a visitor needs to decide, then the way
    through. The platform will own price, intakes and seats, joined by slug.
    """

    title = models.CharField(max_length=120)
    slug = models.CharField(
        max_length=120,
        unique=True,
        validators=[validate_slug],
        help_text="Shared with the e-learning platform - don't change after launch.",
    )
    summary = models.TextField(max_length=400, blank=True)
    audience = models.TextField(max_length=400)
    format = models.CharField(max_length=120, blank=True, help_text='e.g. "In person, Kigali"')
    duration = models.CharField(
        max_length=120, blank=True, help_text='e.g. "4 weeks - 8 sessions, 1.5 hrs each"'
    )
    price_amount = models.PositiveIntegerField(
        null=True, blank=True, help_text="Whole amount (RWF has no decimals)."
    )
    currency = models.CharField(max_length=3, choices=[("RWF", "RWF")], default="RWF")
    price_note = models.CharField(max_length=60, blank=True, help_text='e.g. "per learner"')

    search_fields = [index.SearchField("title"), index.AutocompleteField("title")]

    panels = [
        FieldPanel("title"),
        FieldPanel("summary"),
        FieldPanel("audience"),
        InlinePanel("outcome_items", label="What you'll be able to do"),
        MultiFieldPanel(
            [
                FieldPanel("format"),
                FieldPanel("duration"),
                FieldRowPanel(
                    [FieldPanel("price_amount"), FieldPanel("currency"), FieldPanel("price_note")]
                ),
                InlinePanel("intake_items", label="Intakes"),
            ],
            heading="Schedule & price (interim - moves to the e-learning platform)",
        ),
        InlinePanel(
            "module_items",
            label=(
                "Syllabus - not shown on the website: it is the gate to the e-learning "
                "platform, which owns course outlines (ADR-007)"
            ),
        ),
        *SeoFields.seo_panels,
        FieldPanel("slug"),
        PublishingPanel(),
    ]

    class Meta:
        ordering = ["created_at"]
        verbose_name = "course"
        constraints = [
            models.CheckConstraint(condition=Q(currency="RWF"), name="course_currency_valid")
        ]

    def __str__(self) -> str:
        return self.title


class CourseOutcome(Orderable):
    course = ParentalKey(Course, on_delete=models.CASCADE, related_name="outcome_items")
    outcome = models.CharField(max_length=200)

    panels = [FieldPanel("outcome")]


class CourseModule(Orderable):
    course = ParentalKey(Course, on_delete=models.CASCADE, related_name="module_items")
    title = models.CharField(max_length=160)
    summary = models.TextField(max_length=600, blank=True)

    panels = [FieldPanel("title"), FieldPanel("summary")]


class CourseIntake(Orderable):
    course = ParentalKey(Course, on_delete=models.CASCADE, related_name="intake_items")
    label = models.CharField(max_length=80)
    starts_on = models.DateField()

    panels = [FieldRowPanel([FieldPanel("label"), FieldPanel("starts_on")])]


# ------------------------------------------------------------- articles


class Article(SeoFields, index.Indexed, Revisioned):
    """Insights: plain-language explainers (the EBM education series first)."""

    title = models.CharField(max_length=160)
    slug = models.CharField(max_length=160, unique=True, validators=[validate_slug])
    published_on = models.DateField()
    author_name = models.CharField(max_length=80)
    excerpt = models.TextField(max_length=300)
    body = RichTextField(features=RICH_TEXT_FEATURES)

    search_fields = [index.SearchField("title"), index.AutocompleteField("title")]

    panels = [
        FieldPanel("title"),
        FieldRowPanel([FieldPanel("published_on"), FieldPanel("author_name")]),
        FieldPanel("excerpt"),
        FieldPanel("body"),
        *SeoFields.seo_panels,
        FieldPanel("slug"),
        PublishingPanel(),
    ]

    class Meta:
        ordering = ["-published_on"]
        verbose_name = "article"

    def __str__(self) -> str:
        return self.title


# ---------------------------------------------------------------- demos


class Demo(index.Indexed, Revisioned):
    """
    A demo in the Demo Library (/demos): a short look at how one service
    works. Until it is recorded, leave the video link empty - the website
    shows it as "Coming soon" and offers a live walkthrough instead, so no
    card ever pretends to play something that doesn't exist.
    """

    FORMATS = [
        ("video", "Video walkthrough"),
        ("tour", "Guided tour"),
        ("live", "Live walkthrough (on request)"),
    ]
    DIVISIONS = [*DIVISION_CHOICES, ("bundle", "All four (one relationship)")]

    title = models.CharField(max_length=120)
    slug = models.CharField(max_length=120, unique=True, validators=[validate_slug])
    summary = models.TextField(
        max_length=300, help_text="What the visitor will see, in one or two sentences."
    )
    division = models.CharField(
        max_length=20, choices=DIVISIONS, help_text="Sets the card's colour and its Service filter."
    )
    audiences = ParentalManyToManyField(
        "content.SitePage",
        blank=True,
        related_name="+",
        limit_choices_to={"page_type": "solution"},
        verbose_name="kinds of business",
        help_text="The solution pages this demo is for (the Kind of business filter).",
    )
    format = models.CharField(max_length=10, choices=FORMATS, default="video")
    video_url = models.CharField(
        "video link",
        max_length=300,
        blank=True,
        validators=[validate_https_url],
        help_text="Leave empty until the demo is recorded: the card then shows Coming soon.",
    )
    duration = models.CharField(
        max_length=20, blank=True, help_text="e.g. 2 min 15 s. Shown only with a video link."
    )

    search_fields = [index.SearchField("title"), index.AutocompleteField("title")]

    panels = [
        FieldPanel("title"),
        FieldPanel("summary"),
        FieldRowPanel([FieldPanel("division"), FieldPanel("format")]),
        FieldPanel("audiences", widget=forms.CheckboxSelectMultiple),
        FieldRowPanel([FieldPanel("video_url"), FieldPanel("duration")]),
        FieldPanel("slug"),
        PublishingPanel(),
    ]

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "demo"

    def __str__(self) -> str:
        return self.title


# ------------------------------------------------------------ redirects


class Redirect(models.Model):
    """An old URL sent somewhere new, checked by the public site before a 404."""

    from_path = models.CharField(
        "from", max_length=500, unique=True, help_text="A site path, e.g. /old-page"
    )
    to = models.CharField(max_length=500, validators=[validate_href])
    permanent = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    panels = [FieldPanel("from_path"), FieldPanel("to"), FieldPanel("permanent")]

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=Q(from_path__startswith="/") & ~Q(from_path__startswith="//"),
                name="redirect_from_is_a_site_path",
                violation_error_message="Use a site path starting with /.",
            ),
            models.CheckConstraint(
                condition=~Q(from_path=F("to")),
                name="redirect_not_to_itself",
                violation_error_message="A redirect can't point to its own address.",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.from_path} -> {self.to}"

    def clean(self) -> None:
        if not self.from_path.startswith("/") or self.from_path.startswith("//"):
            raise ValidationError({"from_path": "Use a site path starting with /."})


# ------------------------------------------------------------- settings


@register_setting(icon="cog")
class SiteSettings(ClusterableModel, BaseGenericSetting):
    """Facts the business, not a developer, should control."""

    ENROLLMENT_MODES = [
        ("waitlist", "Waitlist (course buttons open a waitlist)"),
        ("lms", "E-learning platform (course buttons link to it)"),
    ]

    legal_name = models.CharField(max_length=80)
    trading_name = models.CharField(max_length=80)
    motto = models.CharField(max_length=80)
    elevator_pitch = models.TextField(max_length=700)
    audience_line = models.CharField(
        max_length=160,
        blank=True,
        help_text=(
            'Who the site is for, in one line (e.g. "For growing businesses in Rwanda"). '
            "Leave empty until the business has agreed the wording."
        ),
    )
    boilerplate = models.TextField(
        max_length=600, blank=True, help_text="The approved company paragraph. Shown in the footer."
    )
    email = models.EmailField()
    phone = models.CharField(max_length=30)
    whatsapp = models.CharField(
        max_length=30,
        blank=True,
        help_text="International format. Leave empty if the phone number is the WhatsApp number.",
    )
    address = models.TextField(max_length=300)
    response_time_commitment = models.CharField(
        max_length=120,
        blank=True,
        help_text=(
            'Shown after a form is sent, e.g. "within one business day". '
            "Only a promise the team can keep."
        ),
    )
    lead_notification_email = models.EmailField(
        blank=True,
        help_text=(
            "Internal inbox told about each new enquiry. The email only says one arrived "
            "and links to the CMS - the person's details stay in the CMS."
        ),
    )
    announcement_text = models.CharField(
        max_length=140,
        blank=True,
        help_text=(
            "A banner above every page - for a real, dated event only. Leave empty otherwise."
        ),
    )
    announcement_label = models.CharField(max_length=60, blank=True)
    announcement_href = models.CharField(max_length=500, blank=True, validators=[validate_href])
    enrollment_mode = models.CharField(
        max_length=10,
        choices=ENROLLMENT_MODES,
        default="waitlist",
        help_text=(
            "The planned hand-over point to the e-learning platform (ADR-007). Admins only: "
            "switch only after the customer journey has passed on staging (ADR-011)."
        ),
    )
    lms_base_url = models.CharField(
        "e-learning platform address",
        max_length=200,
        blank=True,
        validators=[validate_https_url],
        help_text="e.g. https://learn.example.rw",
    )
    privacy_notice_version = models.CharField(
        max_length=40,
        default="draft",
        help_text=(
            'Stored with every consent. Change it (e.g. "2026-11-01") whenever the published '
            "privacy notice changes."
        ),
    )

    company_panels = [
        FieldRowPanel([FieldPanel("legal_name"), FieldPanel("trading_name")]),
        FieldPanel("motto"),
        FieldPanel("elevator_pitch"),
        FieldPanel("audience_line"),
        FieldPanel("boilerplate"),
        InlinePanel(
            "company_facts",
            label="Company facts (verifiable only: registration, licence)",
            max_num=5,
        ),
    ]
    contact_panels = [
        FieldRowPanel([FieldPanel("email"), FieldPanel("phone"), FieldPanel("whatsapp")]),
        FieldPanel("address"),
        FieldPanel("response_time_commitment"),
        FieldPanel("lead_notification_email"),
        InlinePanel(
            "social_links",
            label="Social accounts (each turns its footer icon into a link)",
            max_num=6,
        ),
    ]
    announcement_panels = [
        FieldPanel("announcement_text"),
        FieldRowPanel([FieldPanel("announcement_label"), FieldPanel("announcement_href")]),
    ]
    academy_panels = [
        # Release decisions, not content edits (ADR-011): admins only. A
        # field a user may not see isn't in their form, so it can't change.
        FieldPanel("enrollment_mode", permission="superuser"),
        FieldPanel("lms_base_url", permission="superuser"),
    ]
    privacy_panels = [FieldPanel("privacy_notice_version")]

    edit_handler = TabbedInterface(
        [
            ObjectList(company_panels, heading="Company"),
            ObjectList(contact_panels, heading="Contact"),
            ObjectList(announcement_panels, heading="Announcement"),
            ObjectList(academy_panels, heading="Academy"),
            ObjectList(privacy_panels, heading="Privacy"),
        ]
    )

    class Meta:
        verbose_name = "site settings"


class CompanyFact(Orderable):
    settings = ParentalKey(SiteSettings, on_delete=models.CASCADE, related_name="company_facts")
    fact = models.CharField(max_length=80)

    panels = [FieldPanel("fact")]


SOCIAL_NETWORKS = [
    ("facebook", "Facebook"),
    ("linkedin", "LinkedIn"),
    ("instagram", "Instagram"),
    ("x", "X"),
    ("youtube", "YouTube"),
    ("tiktok", "TikTok"),
]


class SocialLink(Orderable):
    """
    One of Z-GATE's official accounts. The footer always shows the six
    network icons; adding an account here turns its icon into a link (until
    then it is a dimmed placeholder, never a link to nowhere).
    """

    NETWORKS = SOCIAL_NETWORKS
    # The address must be on the network's own site, so a typo or a
    # look-alike domain can't send visitors somewhere else.
    HOSTS = {
        "facebook": ("facebook.com",),
        "linkedin": ("linkedin.com",),
        "instagram": ("instagram.com",),
        "x": ("x.com", "twitter.com"),
        "youtube": ("youtube.com",),
        "tiktok": ("tiktok.com",),
    }

    settings = ParentalKey(SiteSettings, on_delete=models.CASCADE, related_name="social_links")
    network = models.CharField(max_length=20, choices=NETWORKS)
    url = models.CharField(
        max_length=300,
        validators=[validate_https_url],
        help_text="The account's full address, e.g. https://www.linkedin.com/company/…",
    )

    panels = [FieldRowPanel([FieldPanel("network"), FieldPanel("url")])]

    class Meta(Orderable.Meta):
        constraints = [
            models.CheckConstraint(
                condition=Q(network__in=[n for n, _ in SOCIAL_NETWORKS]),
                name="sociallink_network_valid",
            ),
            # One account per network: the footer has one icon for each.
            models.UniqueConstraint(
                fields=["settings", "network"],
                name="sociallink_one_per_network",
                violation_error_message="This network already has an account.",
            ),
        ]

    def clean(self) -> None:
        super().clean()
        host = (urlsplit(self.url).hostname or "").lower()
        allowed = self.HOSTS.get(self.network, ())
        if not any(host == domain or host.endswith(f".{domain}") for domain in allowed):
            raise ValidationError({"url": f"Use an address on {' or '.join(allowed)}."})
