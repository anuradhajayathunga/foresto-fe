#!/bin/bash
# Azure App Service startup script for the Django backend

set -e

log() { echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] $*"; }

log "--- Running database migrations ---"
python manage.py migrate --noinput

log "--- Collecting static files ---"
python manage.py collectstatic --noinput

log "--- Starting Gunicorn ---"
# 'config.wsgi' refers to web/backend/config/wsgi.py (the Django project package is named 'config').
# Adjust this path if you rename the project package.
gunicorn \
  --bind 0.0.0.0:8000 \
  --workers 4 \
  --timeout 120 \
  --access-logfile '-' \
  --error-logfile '-' \
  config.wsgi:application
