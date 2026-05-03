#!/usr/bin/env bash
set -e

echo "Starting Foresto backend via start.sh"

# change into backend directory
cd "web/backend"

echo "Installing Python dependencies..."
python -m pip install --upgrade pip || true
python -m pip install -r requirements.txt

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

PORT=${PORT:-8000}
echo "Starting Gunicorn on 0.0.0.0:${PORT}"
exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT} --workers 2
