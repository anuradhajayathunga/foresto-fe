#!/bin/bash
# Docker entrypoint — runs at container start, after env vars are injected.
set -e

echo "Applying database migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting Gunicorn..."
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:"${PORT:-8000}" \
    --workers 4 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -
