"""
Imports the approved copy into the CMS:   python manage.py seed_content

Safe to re-run: it creates only what's missing and never overwrites
anything that already exists, so editors' work in the CMS is never lost.
Everything is published except the privacy notice, which stays a draft
until legal counsel supplies the wording. Seeding doesn't tell the public
site to refresh (it runs before the site has content to cache).
"""

from __future__ import annotations

from typing import Any

from django.core.management.base import BaseCommand
from django.db import transaction
from wagtail.models import Page, Site

from content.models import (
    CompanyFact,
    Course,
    CourseOutcome,
    Demo,
    Division,
    DivisionCommitment,
    DivisionIncluded,
    DivisionQuestion,
    SitePage,
    SiteSettings,
)
from content.revalidate import suspended
from content.seed import COPY, DEMOS, PAGES


class Command(BaseCommand):
    help = "Imports the approved website copy into the CMS (creates only what's missing)."

    def handle(self, *args: Any, **options: Any) -> None:
        with suspended(), transaction.atomic():
            self._settings()
            self._divisions()
            self._courses()
            self._pages()
            self._demos()
        self.stdout.write(self.style.SUCCESS("Seed complete."))

    def _log(self, message: str) -> None:
        self.stdout.write(message)

    def _settings(self) -> None:
        settings = SiteSettings.load()
        if settings.legal_name:
            self._log("site-settings: already set, skipped")
            return
        company = COPY["company"]
        settings.legal_name = company["legalName"]
        settings.trading_name = company["tradingName"]
        settings.motto = company["motto"]
        settings.elevator_pitch = COPY["elevatorPitch"]
        settings.boilerplate = COPY["boilerplate"]
        settings.email = company["email"]
        settings.phone = company["phone"]
        settings.address = company["address"]
        settings.enrollment_mode = "waitlist"
        settings.privacy_notice_version = "draft"
        settings.company_facts = [CompanyFact(fact=fact) for fact in COPY["companyFacts"]]
        settings.save()
        self._log("site-settings: created")

    def _divisions(self) -> None:
        for d in COPY["divisions"]:
            if Division.objects.filter(slug=d["slug"]).exists():
                self._log(f"divisions/{d['slug']}: exists, skipped")
                continue
            division = Division(
                slug=d["slug"],
                order=d["order"],
                name=d["name"],
                short_name=d["shortName"],
                subtitle=d["subtitle"],
                pillar=d["pillar"],
                headline=d["headline"],
                mission=d["mission"],
                about=d["about"],
                audience=d["audience"],
                proof=d["proof"],
                objection_question=d["objection"]["question"],
                objection_answer=d["objection"]["answer"],
                cta_label=d["cta"]["label"],
                cta_href=d["cta"]["href"],
                seo_title=d["meta"]["title"],
                seo_description=d["meta"]["description"],
            )
            division.included_items = [DivisionIncluded(item=item) for item in d["included"]]
            division.commitment_items = [
                DivisionCommitment(figure=c["figure"], label=c["label"]) for c in d["commitments"]
            ]
            division.faq_items = [
                DivisionQuestion(question=q["question"], answer=q["answer"]) for q in d["faq"]
            ]
            division.save()
            division.save_revision().publish()
            self._log(f"divisions/{d['slug']}: created")

    def _courses(self) -> None:
        for c in COPY["courses"]:
            if Course.objects.filter(slug=c["slug"]).exists():
                self._log(f"courses/{c['slug']}: exists, skipped")
                continue
            course = Course(
                title=c["title"],
                slug=c["slug"],
                summary=c["summary"],
                audience=c["audience"],
                format=c["format"],
                duration=c["duration"],
                price_amount=c["priceAmount"],
                currency="RWF",
                price_note=c["priceNote"],
            )
            course.outcome_items = [CourseOutcome(outcome=o) for o in c["outcomes"]]
            course.save()
            course.save_revision().publish()
            self._log(f"courses/{c['slug']}: created")

    def _home(self) -> SitePage:
        """The site's root page: our SitePage "home", replacing Wagtail's stock welcome page."""
        site = Site.objects.filter(is_default_site=True).first()
        existing = SitePage.objects.filter(depth=2, slug="home").first()
        if existing is not None:
            return existing
        root = Page.get_first_root_node()
        # Wagtail's own initial migration creates a placeholder "Welcome to
        # your new Wagtail site!" page at slug "home"; remove it if untouched.
        for placeholder in root.get_children().filter(slug="home"):
            if placeholder.specific_class is Page:
                placeholder.delete()
        spec = PAGES[0]
        home = SitePage(
            title=spec["title"],
            slug=spec["slug"],
            page_type=spec["page_type"],
            seo_title=spec["seo_title"],
            search_description=spec["search_description"],
            layout=spec["layout"](),
        )
        root.add_child(instance=home)
        home.save_revision().publish()
        if site is None:
            Site.objects.create(hostname="localhost", root_page=home, is_default_site=True)
        else:
            site.root_page = home
            site.save()
        self._log("pages/home: created")
        return home

    def _pages(self) -> None:
        home = self._home()
        for spec in PAGES[1:]:
            if SitePage.objects.filter(slug=spec["slug"]).exists():
                self._log(f"pages/{spec['slug']}: exists, skipped")
                continue
            page = SitePage(
                title=spec["title"],
                slug=spec["slug"],
                page_type=spec["page_type"],
                seo_title=spec["seo_title"],
                search_description=spec["search_description"],
                layout=spec["layout"](),
                live=spec["publish"],
            )
            # Solution pages sit under the Solutions page, which comes first in PAGES.
            parent = SitePage.objects.get(slug=spec["parent"]) if "parent" in spec else home
            parent.add_child(instance=page)
            revision = page.save_revision()
            if spec["publish"]:
                revision.publish()
            self._log(
                f"pages/{spec['slug']}: created"
                + ("" if spec["publish"] else " as draft (needs legal wording)")
            )

    def _demos(self) -> None:
        """Demo Library placeholders (no video yet): after the pages, which they link to."""
        for d in DEMOS:
            if Demo.objects.filter(slug=d["slug"]).exists():
                self._log(f"demos/{d['slug']}: exists, skipped")
                continue
            demo = Demo(
                slug=d["slug"],
                title=d["title"],
                summary=d["summary"],
                division=d["division"],
                format="video",
            )
            demo.audiences = list(SitePage.objects.filter(slug__in=d["audiences"]))
            demo.save()
            demo.save_revision().publish()
            self._log(f"demos/{d['slug']}: created")
