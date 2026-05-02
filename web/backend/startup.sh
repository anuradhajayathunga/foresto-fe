#!/bin/bash
# Azure App Service startup script for the Django backend.
# This file is used when deploying WITHOUT Docker (Python runtime on App Service).
# Azure App Service runs this after installing requirements.txt automatically.

set -e

cd /home/site/wwwroot

# Apply any pending database migrations
python manage.py migrate --noinput

# Collect static files
python manage.py collectstatic --noinput

# Start Gunicorn
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:"${PORT:-8000}" \
    --workers 4 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -
