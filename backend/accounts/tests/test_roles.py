"""The Editors / Publishers roles and what each may do, through the real admin."""

from __future__ import annotations

from typing import Any

import pytest
from wagtail.permissions import policy_registry

from accounts.models import User
from leads.models import Lead

pytestmark = pytest.mark.usefixtures("seeded")


def test_editors_draft_but_cannot_publish_or_see_leads(editor: User, logged_in: Any) -> None:
    assert editor.has_perm("content.change_course")
    assert not editor.has_perm("content.publish_course")
    assert not editor.has_perm("leads.view_lead")
    assert logged_in(editor).get("/admin/leads/").status_code in (302, 403)


def test_publishers_publish_and_work_leads(publisher: User, logged_in: Any) -> None:
    assert publisher.has_perm("content.publish_course")
    assert publisher.has_perm("leads.change_lead")
    assert logged_in(publisher).get("/admin/leads/").status_code == 200


def test_nobody_adds_a_lead_by_hand_and_only_admins_delete(
    publisher: User, admin_user: User
) -> None:
    policy = policy_registry.get_by_type(Lead)
    assert not policy.user_has_permission(admin_user, "add")
    assert policy.user_has_permission(admin_user, "delete")
    assert not policy.user_has_permission(publisher, "delete")


def test_only_admins_see_the_enrollment_switch(
    publisher: User, admin_user: User, logged_in: Any
) -> None:
    url = "/admin/settings/content/sitesettings/"
    as_publisher = logged_in(publisher).get(url, follow=True)
    assert as_publisher.status_code == 200
    assert "privacy_notice_version" in as_publisher.content.decode()  # the form rendered
    assert "enrollment_mode" not in as_publisher.content.decode()
    assert "enrollment_mode" in logged_in(admin_user).get(url, follow=True).content.decode()
