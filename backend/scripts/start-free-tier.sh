#!/bin/sh
# Start command for Render's free tier (render.free.yaml), which has no
# pre-deploy command, shell or one-off jobs. Each start - including every
# wake-up after Render spins the service down - brings the database up to
# date and fills in what's missing, then serves:
#   - migrate:          no-op when there is nothing new
#   - seed_content:     creates only what's missing, never overwrites edits
#   - ensure_superuser: the first admin from DJANGO_SUPERUSER_EMAIL/PASSWORD,
#                       only while no admin exists
# Paid plans use render.yaml instead: migrations as a pre-deploy step, and
# the image's own CMD.
set -eu
python manage.py migrate --noinput
python manage.py seed_content
python manage.py ensure_superuser
exec gunicorn config.wsgi --bind 0.0.0.0:3004 --timeout 30 \
  --access-logfile - --forwarded-allow-ips '*'
