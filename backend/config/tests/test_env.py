from pathlib import Path

import pytest

from config import env
from config.env import ConfigError, load

BASE = {
    "DJANGO_SECRET_KEY": "k" * 50,
    "DATABASE_URL": "postgres://u:p@localhost:5432/db",
}


def test_accepts_a_minimal_development_environment() -> None:
    config = load(BASE, environment="development")
    assert config.environment == "development"
    assert config.admin_url == "http://localhost:3004"
    assert "website-backend" in config.allowed_hosts


def test_allows_the_platform_address_render_sets() -> None:
    config = load(
        {**BASE, "RENDER_EXTERNAL_HOSTNAME": "zgate-website-cms.onrender.com"},
        environment="development",
    )
    assert "zgate-website-cms.onrender.com" in config.allowed_hosts


def test_treats_blank_values_as_unset() -> None:
    config = load({**BASE, "SMTP_HOST": "", "LEAD_INTAKE_TOKEN": ""}, environment="development")
    assert config.smtp_host is None
    assert config.lead_intake_token is None


def test_reports_problems_by_name_never_by_value() -> None:
    with pytest.raises(ConfigError) as caught:
        load(
            {"DJANGO_SECRET_KEY": "short-secret", "DATABASE_URL": "mysql://x"},
            environment="development",
        )
    message = str(caught.value)
    assert "DJANGO_SECRET_KEY" in message
    assert "DATABASE_URL" in message
    assert "short-secret" not in message


def test_production_requires_the_shared_secrets_and_https() -> None:
    with pytest.raises(ConfigError) as caught:
        load(BASE, environment="production")
    message = str(caught.value)
    for name in (
        "CMS_API_TOKEN",
        "LEAD_INTAKE_TOKEN",
        "REVALIDATE_URL",
        "REVALIDATE_SECRET",
        "ADMIN_URL",
    ):
        assert name in message


def test_short_shared_secrets_are_refused() -> None:
    with pytest.raises(ConfigError, match="LEAD_INTAKE_TOKEN"):
        load({**BASE, "LEAD_INTAKE_TOKEN": "too-short"}, environment="development")
    with pytest.raises(ConfigError, match="CMS_API_TOKEN"):
        load({**BASE, "CMS_API_TOKEN": "too-short"}, environment="development")


def test_accepts_a_complete_production_environment() -> None:
    config = load(
        {
            **BASE,
            "ADMIN_URL": "https://cms.example.rw",
            "CMS_API_TOKEN": "a" * 32,
            "LEAD_INTAKE_TOKEN": "l" * 32,
            "REVALIDATE_URL": "https://www.example.rw/api/revalidate",
            "REVALIDATE_SECRET": "r" * 32,
        },
        environment="production",
    )
    assert config.cms_api_token == "a" * 32
    assert "cms.example.rw" in config.allowed_hosts


def test_development_may_use_a_local_sqlite_file() -> None:
    config = load({**BASE, "DATABASE_URL": "sqlite:///db.sqlite3"}, environment="development")
    assert config.database_url == "sqlite:///db.sqlite3"


def test_production_refuses_sqlite() -> None:
    with pytest.raises(ConfigError, match="DATABASE_URL: must be a postgres:// URL in production"):
        load(
            {
                **BASE,
                "DATABASE_URL": "sqlite:///db.sqlite3",
                "ADMIN_URL": "https://cms.example.rw",
                "CMS_API_TOKEN": "a" * 32,
                "LEAD_INTAKE_TOKEN": "l" * 32,
                "REVALIDATE_URL": "https://www.example.rw/api/revalidate",
                "REVALIDATE_SECRET": "r" * 32,
            },
            environment="production",
        )


def test_revalidate_url_needs_its_secret() -> None:
    with pytest.raises(ConfigError, match="REVALIDATE_SECRET"):
        load(
            {**BASE, "REVALIDATE_URL": "http://frontend:3002/api/revalidate"},
            environment="development",
        )


def test_build_phase_needs_no_secrets_even_with_production_settings() -> None:
    config = load({"DJANGO_BUILD": "1"}, environment="production")
    assert len(config.secret_key) >= 32


@pytest.fixture
def dotenv(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """A developer's backend/.env pointing at their own database."""
    (tmp_path / ".env").write_text(
        "DJANGO_SECRET_KEY=" + "d" * 40 + "\nDATABASE_URL=postgres://dev:dev@localhost/dev\n",
        encoding="utf-8",
    )
    monkeypatch.setattr(env, "BASE_DIR", tmp_path)
    monkeypatch.setattr(env, "_current", env._current)
    monkeypatch.delenv("DATABASE_URL", raising=False)


@pytest.mark.usefixtures("dotenv")
def test_tests_never_read_the_developers_dotenv() -> None:
    assert env.configure("test").database_url == "sqlite://:memory:"


@pytest.mark.usefixtures("dotenv")
def test_development_reads_the_dotenv() -> None:
    assert env.configure("development").database_url == "postgres://dev:dev@localhost/dev"


@pytest.mark.usefixtures("dotenv")
def test_production_ignores_a_dotenv(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DJANGO_BUILD", "1")
    assert env.configure("production").database_url == env.BUILD_PLACEHOLDERS["DATABASE_URL"]
