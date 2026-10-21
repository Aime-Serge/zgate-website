# Z-GATE website CMS: Django + Wagtail, headless (ADR-012).
#
# Build context is THIS FOLDER (backend/): the CMS needs nothing from the
# rest of the repository, so any host or platform can build it from here
# alone (backend/.dockerignore keeps .env, the virtualenv and deploy/ out):
#   docker build --target prod -t zgate-website-backend backend
#
# One image for every environment: no build arguments, no database or
# secrets at build time (DJANGO_BUILD=1 lets collectstatic import the
# settings). Everything else is read at runtime (config/env.py).
#
# The same image runs migrations as a one-off before each rollout
# (backend/deploy/compose.yml, docs/DEPLOYMENT.md):
#   python manage.py migrate --noinput

FROM python:3.14-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1
# Debian security updates (Trivy gate).
RUN apt-get update \
 && apt-get upgrade -y --no-install-recommends \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# The full lock, installed exactly: --no-deps means nothing outside
# requirements/base.txt can be pulled in.
COPY requirements/base.txt requirements/base.txt
RUN pip install --no-deps -r requirements/base.txt

COPY . ./
# Staging and production settings; local Compose overrides this with
# config.settings.development.
ENV DJANGO_SETTINGS_MODULE=config.settings.production \
    MEDIA_DIR=/data/media
RUN DJANGO_BUILD=1 python manage.py collectstatic --noinput \
 # No package manager left in the image - it runs with `python` only.
 && python -m pip uninstall -y pip \
 && groupadd --gid 1001 zgate \
 && useradd --uid 1001 --gid zgate --shell /bin/false zgate \
 && mkdir -p /data/media \
 && chown zgate:zgate /data/media
USER zgate

# ---- prod: the CMS behind gunicorn ----
FROM base AS prod
# Uploaded media lives on a mounted volume until object storage.
VOLUME ["/data/media"]
EXPOSE 3004
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["python", "-c", "import sys, urllib.request; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:3004/api/health', timeout=4).status == 200 else 1)"]
# The CMS host's own proxy terminates TLS and is the container's only
# client (no host port is published), so forwarded headers are trusted
# from it. Workers: gunicorn reads WEB_CONCURRENCY (about 2 x CPU cores + 1;
# 3 suits a 1-2 vCPU host). Many platforms set it for you.
ENV WEB_CONCURRENCY=3
CMD ["gunicorn", "config.wsgi", "--bind", "0.0.0.0:3004", "--timeout", "30", \
     "--access-logfile", "-", "--forwarded-allow-ips", "*"]
