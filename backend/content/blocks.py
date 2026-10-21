"""
Page-building blocks. Their names are the `blockType` values the public
site renders (frontend/src/components/blocks/RenderBlocks.tsx).

Deliberately absent: testimonial, rating and client logo blocks. Z-GATE
has no real, consented social proof yet, and the brand rule is never to
fabricate it (docs/CONTENT_GUIDE.md). Adding one is a reviewed code
change, not an editor's choice.

Numbers are allowed only in two shapes that can't carry invented proof:
cited market research (a figure can't be saved without its source) and
our own published service commitments (always captioned as commitments,
never results).
"""

from django.core.exceptions import ValidationError
from wagtail import blocks
from wagtail.snippets.blocks import SnippetChooserBlock

from content.validators import DIVISION_CHOICES, validate_href

COMMITMENT_NOTE = (
    "Targets from our client service agreements: commitments we are held to, not past results."
)
RICH_TEXT_FEATURES = ["h2", "h3", "bold", "italic", "link", "ol", "ul"]


def eyebrow() -> blocks.CharBlock:
    """Small mono label above a section heading - the brand guide's eyebrow."""
    return blocks.CharBlock(max_length=60, required=False)


def division(*, allow_bundle: bool) -> blocks.ChoiceBlock:
    choices = [*DIVISION_CHOICES]
    if allow_bundle:
        choices.append(("bundle", "All four (one relationship)"))
    return blocks.ChoiceBlock(
        choices=choices, required=False, help_text="Sets the colour. Each division keeps its own."
    )


class LinkBlock(blocks.StructBlock):
    label = blocks.CharBlock(max_length=60, required=False)
    href = blocks.CharBlock(required=False, validators=[validate_href])


class HeroBlock(blocks.StructBlock):
    eyebrow = blocks.CharBlock(max_length=80, required=False)
    headline = blocks.TextBlock(max_length=160)
    headline_accent = blocks.CharBlock(
        max_length=80,
        required=False,
        help_text=(
            "Optional. The opening words of the headline to show in the brand gradient, "
            "copied exactly (e.g. 'Stop juggling four vendors')."
        ),
    )
    lede = blocks.TextBlock(max_length=700, required=False)
    cta = LinkBlock(label="Button (optional)")
    layout = blocks.ChoiceBlock(
        choices=[
            ("stacked", "Text in one column"),
            ("split", "Headline left, text right"),
            ("centered", "Centred: a short brand statement (headline of three lines or fewer)"),
        ],
        default="stacked",
    )
    visual = blocks.ChoiceBlock(
        choices=[("none", "None"), ("gate", "The gate and its four rooms")], default="none"
    )

    def clean(self, value):
        cleaned = super().clean(value)
        accent = cleaned.get("headline_accent")
        if accent and not cleaned["headline"].startswith(accent):
            raise blocks.StructBlockValidationError(
                block_errors={
                    "headline_accent": ValidationError(
                        "Must be the opening words of the headline, exactly as written."
                    )
                }
            )
        return cleaned


class FactStripBlock(blocks.StructBlock):
    """The company facts from Site settings (registration, licence) as a strip."""

    heading = blocks.CharBlock(
        max_length=80,
        required=False,
        help_text="Optional. Edit the facts themselves in Settings > Site settings.",
    )


class DoorBlock(blocks.StructBlock):
    need = blocks.CharBlock(
        max_length=90, help_text='The need as a visitor would say it, e.g. "My EBM keeps failing".'
    )
    answer = blocks.TextBlock(max_length=240, required=False)
    division = division(allow_bundle=True)
    label = blocks.CharBlock(max_length=60)
    href = blocks.CharBlock(validators=[validate_href])


class DoorsBlock(blocks.StructBlock):
    """'What do you need?' - entrances in the visitor's own words (docs/CONTENT_GUIDE.md)."""

    eyebrow = eyebrow()
    heading = blocks.CharBlock(max_length=120)
    items = blocks.ListBlock(DoorBlock(), min_num=2, max_num=6)


class MarketFactBlock(blocks.StructBlock):
    figure = blocks.CharBlock(max_length=12)
    statement = blocks.CharBlock(max_length=160)


class MarketFactsBlock(blocks.StructBlock):
    """Published market research. A figure can't be saved without its source."""

    eyebrow = eyebrow()
    heading = blocks.CharBlock(max_length=140)
    intro = blocks.TextBlock(max_length=400, required=False)
    items = blocks.ListBlock(MarketFactBlock(), min_num=1, max_num=4)
    source = blocks.CharBlock(
        max_length=300,
        help_text=(
            "The published research these figures come from. Never Z-GATE's own results - "
            "those need real, consented case studies."
        ),
    )


class DivisionGridBlock(blocks.StructBlock):
    eyebrow = eyebrow()
    heading = blocks.CharBlock(max_length=120, required=False)
    intro = blocks.TextBlock(max_length=400, required=False)


class SolutionGridBlock(blocks.StructBlock):
    """Every published solution page as a card, filled in automatically."""

    eyebrow = eyebrow()
    heading = blocks.CharBlock(max_length=120, required=False)
    intro = blocks.TextBlock(max_length=400, required=False)


class CommitmentBlock(blocks.StructBlock):
    figure = blocks.CharBlock(max_length=16)
    label = blocks.CharBlock(max_length=140)
    division = division(allow_bundle=False)


class CommitmentsBlock(blocks.StructBlock):
    """Our published service commitments as figures - never past results."""

    eyebrow = eyebrow()
    heading = blocks.CharBlock(max_length=120)
    intro = blocks.TextBlock(max_length=400, required=False)
    items = blocks.ListBlock(
        CommitmentBlock(),
        min_num=1,
        max_num=8,
        help_text="Only targets written in a client service agreement (SLA schedule).",
    )
    note = blocks.CharBlock(max_length=160, default=COMMITMENT_NOTE)


class StepBlock(blocks.StructBlock):
    title = blocks.CharBlock(max_length=80)
    body = blocks.TextBlock(max_length=300, required=False)


class StepsBlock(blocks.StructBlock):
    eyebrow = eyebrow()
    heading = blocks.CharBlock(max_length=120)
    intro = blocks.TextBlock(max_length=400, required=False)
    items = blocks.ListBlock(StepBlock(), min_num=2, max_num=6)


class RichTextSectionBlock(blocks.StructBlock):
    eyebrow = eyebrow()
    heading = blocks.CharBlock(max_length=120, required=False)
    content = blocks.RichTextBlock(features=RICH_TEXT_FEATURES)


class FeatureBlock(blocks.StructBlock):
    title = blocks.CharBlock(max_length=120)
    body = blocks.TextBlock(max_length=600, required=False)


class FeatureListBlock(blocks.StructBlock):
    eyebrow = eyebrow()
    heading = blocks.CharBlock(max_length=120, required=False)
    numbered = blocks.BooleanBlock(required=False, help_text="Show 01, 02, 03 beside the items.")
    items = blocks.ListBlock(FeatureBlock(), min_num=1)


class CourseListBlock(blocks.StructBlock):
    eyebrow = eyebrow()
    heading = blocks.CharBlock(max_length=120, required=False)
    courses = blocks.ListBlock(
        SnippetChooserBlock("content.Course"),
        min_num=0,
        help_text="Leave empty to list every published course.",
    )


class QuestionBlock(blocks.StructBlock):
    question = blocks.CharBlock(max_length=200)
    answer = blocks.TextBlock(max_length=1200)


class FaqBlock(blocks.StructBlock):
    eyebrow = eyebrow()
    heading = blocks.CharBlock(max_length=120, required=False)
    items = blocks.ListBlock(QuestionBlock(), min_num=1)


class CallToActionBlock(blocks.StructBlock):
    eyebrow = eyebrow()
    heading = blocks.CharBlock(max_length=120)
    body = blocks.TextBlock(max_length=400, required=False)
    label = blocks.CharBlock(max_length=60)
    href = blocks.CharBlock(validators=[validate_href])


class ShowcaseBlock(blocks.StructBlock):
    """
    The services console: a tab per division, listing what's included (from
    each division's own page, so it never drifts), beside how a request moves
    through Z-GATE.
    """

    eyebrow = eyebrow()
    heading = blocks.CharBlock(max_length=120)
    intro = blocks.TextBlock(max_length=400, required=False)
    steps_heading = blocks.CharBlock(max_length=60, default="How a request moves")
    steps = blocks.ListBlock(
        blocks.CharBlock(max_length=90),
        min_num=2,
        max_num=5,
        help_text="What happens after someone gets in touch, in order. A process, not a result.",
    )


class SpotlightBlock(blocks.StructBlock):
    eyebrow = blocks.CharBlock(max_length=40, required=False)
    title = blocks.CharBlock(max_length=90)
    body = blocks.TextBlock(max_length=300, required=False)
    division = division(allow_bundle=True)
    label = blocks.CharBlock(max_length=40)
    href = blocks.CharBlock(validators=[validate_href])


class SpotlightsBlock(blocks.StructBlock):
    """Up to four things worth a click now - one per division at most: a course, a commitment."""

    items = blocks.ListBlock(SpotlightBlock(), min_num=1, max_num=4)


class PillarBlock(blocks.StructBlock):
    title = blocks.CharBlock(max_length=60)
    body = blocks.TextBlock(max_length=240)
    division = division(allow_bundle=False)


class PillarsBlock(blocks.StructBlock):
    """A positioning statement over the four pillars, one per division."""

    eyebrow = eyebrow()
    heading = blocks.CharBlock(max_length=140)
    intro = blocks.TextBlock(max_length=400, required=False)
    items = blocks.ListBlock(PillarBlock(), min_num=2, max_num=4)


class AudienceBlock(blocks.StructBlock):
    tab = blocks.CharBlock(max_length=40, help_text='Who it\'s for, e.g. "Shop owners".')
    headline = blocks.CharBlock(max_length=120)
    body = blocks.TextBlock(max_length=400)
    points = blocks.ListBlock(
        blocks.CharBlock(max_length=90),
        min_num=1,
        max_num=5,
        help_text="What we take off their plate. Services and written commitments only.",
    )
    division = division(allow_bundle=True)
    label = blocks.CharBlock(max_length=40)
    href = blocks.CharBlock(validators=[validate_href])


class AudiencesBlock(blocks.StructBlock):
    """One tab per kind of visitor, each with what we do for them and the next step."""

    eyebrow = eyebrow()
    heading = blocks.CharBlock(max_length=120)
    intro = blocks.TextBlock(max_length=400, required=False)
    items = blocks.ListBlock(AudienceBlock(), min_num=2, max_num=5)


SCENARIO_NOTE = (
    "Typical requests and the written commitments that apply to them: not client case studies."
)


class ScenarioBlock(blocks.StructBlock):
    situation = blocks.CharBlock(
        max_length=90, help_text='The situation as a client would put it, e.g. "My EBM stopped".'
    )
    response = blocks.TextBlock(max_length=280, help_text="What we do about it.")
    figure = blocks.CharBlock(max_length=16, required=False)
    figure_label = blocks.CharBlock(
        max_length=90,
        required=False,
        help_text="Only a target written in a client service agreement - never a past result.",
    )
    division = division(allow_bundle=False)

    def clean(self, value):
        cleaned = super().clean(value)
        if bool(cleaned.get("figure")) != bool(cleaned.get("figure_label")):
            field = "figure_label" if cleaned.get("figure") else "figure"
            raise blocks.StructBlockValidationError(
                block_errors={field: ValidationError("A figure needs its label, and the reverse.")}
            )
        return cleaned


class ScenariosBlock(blocks.StructBlock):
    """
    Situations we handle, as a carousel. Deliberately not case studies:
    no client names, no results - the note says so on the page.
    """

    eyebrow = eyebrow()
    heading = blocks.CharBlock(max_length=120)
    intro = blocks.TextBlock(max_length=400, required=False)
    items = blocks.ListBlock(ScenarioBlock(), min_num=2, max_num=8)
    note = blocks.CharBlock(max_length=160, default=SCENARIO_NOTE)


class TrustItemBlock(blocks.StructBlock):
    title = blocks.CharBlock(max_length=60)
    body = blocks.TextBlock(max_length=240)


class TrustBlock(blocks.StructBlock):
    """Facts a visitor can check before they call: registration, licence, data residency."""

    eyebrow = eyebrow()
    heading = blocks.CharBlock(max_length=120)
    items = blocks.ListBlock(
        TrustItemBlock(),
        min_num=2,
        max_num=4,
        help_text="Verifiable facts only. No awards, ratings or client counts.",
    )
    link = LinkBlock(label="Link (optional)")


class LatestBlock(blocks.StructBlock):
    """The newest courses and Insights articles, picked automatically from what's published."""

    eyebrow = eyebrow()
    heading = blocks.CharBlock(max_length=120)
    intro = blocks.TextBlock(max_length=400, required=False)


class LeadFormBlock(blocks.StructBlock):
    """Contact form or course waitlist (shown only once a privacy notice is published)."""

    heading = blocks.CharBlock(max_length=120, required=False)
    intro = blocks.TextBlock(max_length=400, required=False)
    variant = blocks.ChoiceBlock(
        choices=[("contact", "Contact enquiry"), ("waitlist", "Course waitlist")],
        default="contact",
    )


PAGE_BLOCKS = [
    ("hero", HeroBlock()),
    ("factStrip", FactStripBlock()),
    ("doors", DoorsBlock()),
    ("marketFacts", MarketFactsBlock()),
    ("divisionGrid", DivisionGridBlock()),
    ("commitments", CommitmentsBlock()),
    ("steps", StepsBlock()),
    ("richText", RichTextSectionBlock()),
    ("featureList", FeatureListBlock()),
    ("courseList", CourseListBlock()),
    ("faq", FaqBlock()),
    ("callToAction", CallToActionBlock()),
    ("leadForm", LeadFormBlock()),
    ("showcase", ShowcaseBlock()),
    ("spotlights", SpotlightsBlock()),
    ("pillars", PillarsBlock()),
    ("audiences", AudiencesBlock()),
    ("scenarios", ScenariosBlock()),
    ("trust", TrustBlock()),
    ("latest", LatestBlock()),
    ("solutionGrid", SolutionGridBlock()),
]

# Marketing pages must give visitors a next step (the v1 About page
# had none). Legal pages are exempt.
NEXT_STEP_BLOCKS = {"callToAction", "leadForm"}
