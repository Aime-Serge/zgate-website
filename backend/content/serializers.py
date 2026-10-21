"""
Content as the public site reads it: the JSON shapes in
packages/cms-contracts/src/content-types.ts (camelCase, blocks tagged with
`blockType`). The frontend renders these directly, so a field rename here
is a contract change there.

Rich text leaves as sanitized HTML: Wagtail's internal link format is
expanded and the result is cleaned with an allowlist (nh3), so even an
editor account in the wrong hands can't put a script on the public site,
whose cached pages need 'unsafe-inline'.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Any

import nh3
from wagtail import blocks
from wagtail.rich_text import expand_db_html
from wagtail.snippets.blocks import SnippetChooserBlock

from content.models import Article, Course, Demo, Division, Redirect, SitePage, SiteSettings

ALLOWED_TAGS = {"p", "br", "h2", "h3", "strong", "b", "em", "i", "ul", "ol", "li", "a"}


def clean_html(source: str) -> str:
    return nh3.clean(
        expand_db_html(source or ""),
        tags=ALLOWED_TAGS,
        attributes={"a": {"href"}},
        url_schemes={"http", "https", "mailto", "tel"},
        link_rel="noopener noreferrer",
    )


def camel(name: str) -> str:
    head, *rest = name.split("_")
    return head + "".join(part.capitalize() for part in rest)


def _text(value: str | None) -> str | None:
    return value or None


def _iso(value: date | datetime | None) -> str | None:
    return value.isoformat() if value else None


def _meta(title: str | None, description: str | None) -> dict[str, str | None]:
    return {"title": _text(title), "description": _text(description)}


# --------------------------------------------------------------- blocks


def _block_value(block: blocks.Block, value: Any) -> Any:
    if isinstance(block, blocks.StructBlock):
        return {
            camel(name): _block_value(child, value.get(name))
            for name, child in block.child_blocks.items()
        }
    if isinstance(block, blocks.ListBlock):
        items = []
        for bound in value.bound_blocks:
            item = _block_value(block.child_block, bound.value)
            if isinstance(item, dict):
                item = {**item, "id": bound.id}
            if item is not None:
                items.append(item)
        return items
    if isinstance(block, blocks.RichTextBlock):
        return clean_html(value.source if value else "")
    if isinstance(block, SnippetChooserBlock):
        # Only published courses; an unpublished one simply drops out.
        return serialize_course(value) if value is not None and value.live else None
    if isinstance(block, blocks.BooleanBlock):
        return bool(value)
    return _text(value) if isinstance(value, str) else value


def serialize_layout(stream: Any) -> list[dict[str, Any]]:
    return [
        {"blockType": child.block_type, "id": child.id, **_block_value(child.block, child.value)}
        for child in stream
    ]


# ---------------------------------------------------------------- types


def serialize_page(page: SitePage, *, with_layout: bool = True) -> dict[str, Any]:
    return {
        "id": page.id,
        "title": page.title,
        "slug": page.slug,
        "pageType": page.page_type,
        "layout": serialize_layout(page.layout) if with_layout else [],
        "meta": _meta(page.seo_title, page.search_description),
        "updatedAt": _iso(page.last_published_at),
        "createdAt": _iso(page.first_published_at),
    }


def serialize_division(division: Division) -> dict[str, Any]:
    return {
        "id": division.id,
        "slug": division.slug,
        "order": division.order,
        "name": division.name,
        "shortName": division.short_name,
        "subtitle": _text(division.subtitle),
        "pillar": _text(division.pillar),
        "headline": _text(division.headline),
        "mission": division.mission,
        "about": division.about,
        "audience": _text(division.audience),
        "included": [{"id": str(i.id), "item": i.item} for i in division.included_items.all()],
        "proof": division.proof,
        "commitments": [
            {"id": str(c.id), "figure": c.figure, "label": c.label}
            for c in division.commitment_items.all()
        ],
        "objection": {
            "question": division.objection_question,
            "answer": division.objection_answer,
        },
        "faq": [
            {"id": str(q.id), "question": q.question, "answer": q.answer}
            for q in division.faq_items.all()
        ],
        "cta": {"label": division.cta_label, "href": division.cta_href},
        "meta": _meta(division.seo_title, division.seo_description),
        "updatedAt": _iso(division.updated_at),
        "createdAt": _iso(division.created_at),
    }


def serialize_course(course: Course) -> dict[str, Any]:
    return {
        "id": course.id,
        "title": course.title,
        "slug": course.slug,
        "summary": _text(course.summary),
        "audience": course.audience,
        "outcomes": [{"id": str(o.id), "outcome": o.outcome} for o in course.outcome_items.all()],
        "syllabus": [
            {"id": str(m.id), "title": m.title, "summary": _text(m.summary)}
            for m in course.module_items.all()
        ],
        "format": _text(course.format),
        "duration": _text(course.duration),
        "priceAmount": course.price_amount,
        "currency": course.currency,
        "priceNote": _text(course.price_note),
        "intakes": [
            {"id": str(i.id), "label": i.label, "startsOn": _iso(i.starts_on)}
            for i in course.intake_items.all()
        ],
        "meta": _meta(course.seo_title, course.seo_description),
        "updatedAt": _iso(course.updated_at),
        "createdAt": _iso(course.created_at),
    }


def serialize_article(article: Article) -> dict[str, Any]:
    return {
        "id": article.id,
        "title": article.title,
        "slug": article.slug,
        "publishedOn": _iso(article.published_on),
        "authorName": article.author_name,
        "excerpt": article.excerpt,
        "body": clean_html(article.body),
        "meta": _meta(article.seo_title, article.seo_description),
        "updatedAt": _iso(article.updated_at),
        "createdAt": _iso(article.created_at),
    }


def serialize_demo(demo: Demo) -> dict[str, Any]:
    return {
        "id": demo.id,
        "slug": demo.slug,
        "title": demo.title,
        "summary": demo.summary,
        "division": demo.division,
        # Published solution pages only: a draft page is not a filter yet.
        "audiences": [
            {"slug": page.slug, "title": page.title} for page in demo.audiences.all() if page.live
        ],
        "format": demo.format,
        "videoUrl": _text(demo.video_url),
        "duration": _text(demo.duration) if demo.video_url else None,
        "updatedAt": _iso(demo.updated_at),
        "createdAt": _iso(demo.created_at),
    }


def serialize_redirect(redirect: Redirect) -> dict[str, Any]:
    return {
        "id": redirect.id,
        "from": redirect.from_path,
        "to": redirect.to,
        "permanent": redirect.permanent,
    }


def serialize_settings(settings: SiteSettings) -> dict[str, Any]:
    """Public fields only: the staff notification inbox stays in the CMS."""
    return {
        "id": settings.id,
        "legalName": settings.legal_name,
        "tradingName": settings.trading_name,
        "motto": settings.motto,
        "elevatorPitch": settings.elevator_pitch,
        "audienceLine": _text(settings.audience_line),
        "boilerplate": _text(settings.boilerplate),
        "companyFacts": [{"id": str(f.id), "fact": f.fact} for f in settings.company_facts.all()],
        "announcement": {
            "text": _text(settings.announcement_text),
            "label": _text(settings.announcement_label),
            "href": _text(settings.announcement_href),
        },
        "email": settings.email,
        "phone": settings.phone,
        "whatsapp": _text(settings.whatsapp),
        "address": settings.address,
        "responseTimeCommitment": _text(settings.response_time_commitment),
        "social": [
            {"id": str(s.id), "network": s.network, "url": s.url}
            for s in settings.social_links.all()
        ],
        "enrollmentMode": settings.enrollment_mode,
        "lmsBaseUrl": _text(settings.lms_base_url),
        "privacyNoticeVersion": settings.privacy_notice_version,
    }
